import { describe, expect, it } from 'vitest';
import { assertCanDecide, can, canAuthorAct, canReadDraft } from '../../src/security/permissions';
import { assertTransition, canTransition, DECISION_TO_STATUS, isEditable } from '../../src/security/stateMachine';

describe('role x action matrix (locked decisions)', () => {
  it('admin governs and reads but never authors or decides', () => {
    expect(can('admin', 'policy:manage')).toBe(true);
    expect(can('admin', 'membership:manage')).toBe(true);
    expect(can('admin', 'analytics:read')).toBe(true);
    expect(can('admin', 'audit:read')).toBe(true);
    expect(can('admin', 'draft:create')).toBe(false);
    expect(can('admin', 'draft:edit')).toBe(false);
    expect(can('admin', 'draft:decide')).toBe(false);
  });
  it('creator authors but has no analytics, audit, or decisions', () => {
    expect(can('creator', 'draft:create')).toBe(true);
    expect(can('creator', 'draft:submit')).toBe(true);
    expect(can('creator', 'analytics:read')).toBe(false);
    expect(can('creator', 'audit:read')).toBe(false);
    expect(can('creator', 'draft:decide')).toBe(false);
    expect(can('creator', 'policy:manage')).toBe(false);
  });
  it('reviewer can also author (so self-review is testable) and decide', () => {
    expect(can('reviewer', 'draft:create')).toBe(true);
    expect(can('reviewer', 'draft:decide')).toBe(true);
    expect(can('reviewer', 'analytics:read')).toBe(true);
    expect(can('reviewer', 'membership:manage')).toBe(false);
    expect(can('reviewer', 'policy:manage')).toBe(false);
  });
  it('denies unknown roles/actions by default', () => {
    expect(can('superuser' as any, 'draft:read')).toBe(false);
    expect(can('admin', 'drop:database' as any)).toBe(false);
  });
});

describe('draft visibility', () => {
  const unsubmitted = { authorId: 'u2', status: 'draft' as const };
  const submitted = { authorId: 'u2', status: 'submitted' as const };
  it('unsubmitted: author and admin only', () => {
    expect(canReadDraft('creator', 'u2', unsubmitted)).toBe(true);
    expect(canReadDraft('admin', 'u1', unsubmitted)).toBe(true);
    expect(canReadDraft('creator', 'u9', unsubmitted)).toBe(false);
    expect(canReadDraft('reviewer', 'u3', unsubmitted)).toBe(false);
  });
  it('submitted: everyone in the workspace', () => {
    expect(canReadDraft('creator', 'u9', submitted)).toBe(true);
    expect(canReadDraft('reviewer', 'u3', submitted)).toBe(true);
  });
  it('admin may not edit/submit/analyse anyone\'s draft; authors may only act on their own', () => {
    expect(canAuthorAct('admin', 'u1', { authorId: 'u1', status: 'draft' }, 'draft:edit')).toBe(false);
    expect(canAuthorAct('creator', 'u2', unsubmitted, 'draft:edit')).toBe(true);
    expect(canAuthorAct('creator', 'u9', unsubmitted, 'draft:edit')).toBe(false);
  });
});

describe('separation of duties', () => {
  it('a reviewer cannot decide on their own draft', () => {
    expect(() => assertCanDecide('reviewer', 'u3', { authorId: 'u3', status: 'submitted' })).toThrow();
  });
  it('a reviewer can decide on someone else\'s draft', () => {
    expect(() => assertCanDecide('reviewer', 'u3', { authorId: 'u2', status: 'submitted' })).not.toThrow();
  });
  it('creators and admins can never decide', () => {
    expect(() => assertCanDecide('creator', 'u2', { authorId: 'u9', status: 'submitted' })).toThrow();
    expect(() => assertCanDecide('admin', 'u1', { authorId: 'u9', status: 'submitted' })).toThrow();
  });
});

describe('draft state machine', () => {
  it('allows only the locked transitions', () => {
    expect(canTransition('draft', 'submitted')).toBe(true);
    expect(canTransition('submitted', 'approved')).toBe(true);
    expect(canTransition('submitted', 'rejected')).toBe(true);
    expect(canTransition('submitted', 'changes_requested')).toBe(true);
    expect(canTransition('changes_requested', 'submitted')).toBe(true);
  });
  it('forbids jumps and leaving terminal states', () => {
    expect(canTransition('draft', 'approved')).toBe(false);
    expect(canTransition('draft', 'rejected')).toBe(false);
    expect(canTransition('approved', 'draft')).toBe(false);
    expect(canTransition('approved', 'submitted')).toBe(false);
    expect(canTransition('rejected', 'submitted')).toBe(false);
    expect(() => assertTransition('draft', 'approved')).toThrow();
  });
  it('maps decisions to statuses and knows which states are editable', () => {
    expect(DECISION_TO_STATUS.approve).toBe('approved');
    expect(DECISION_TO_STATUS.reject).toBe('rejected');
    expect(DECISION_TO_STATUS.request_changes).toBe('changes_requested');
    expect(isEditable('draft')).toBe(true);
    expect(isEditable('changes_requested')).toBe(true);
    expect(isEditable('submitted')).toBe(false);
    expect(isEditable('approved')).toBe(false);
  });
});
