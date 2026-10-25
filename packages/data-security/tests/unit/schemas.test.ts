import { describe, expect, it } from 'vitest';
import {
  createDraftBody, draftDecisionBody, loginBody, policyBody, reviseDraftBody, uploadBody,
} from '../../src/validation/schemas';
import { assertObjectId } from '../../src/validation/ids';

describe('operator-injection and mass-assignment defences', () => {
  it('login rejects {"$ne": null} in email or password', () => {
    expect(loginBody.safeParse({ email: { $ne: null }, password: 'x' }).success).toBe(false);
    expect(loginBody.safeParse({ email: 'a@b.test', password: { $ne: null } }).success).toBe(false);
    expect(loginBody.safeParse({ email: 'a@b.test', password: 'pw' }).success).toBe(true);
  });
  it('rejects objects where strings are expected', () => {
    expect(createDraftBody.safeParse({ title: { $gt: '' }, text: 'hi' }).success).toBe(false);
    expect(reviseDraftBody.safeParse({ text: { $ne: null } }).success).toBe(false);
  });
  it('strict objects reject unknown keys such as workspaceId, authorId, status, role', () => {
    expect(createDraftBody.safeParse({ title: 't', text: 'x', workspaceId: '507f1f77bcf86cd799439011' }).success).toBe(false);
    expect(createDraftBody.safeParse({ title: 't', text: 'x', authorId: '507f1f77bcf86cd799439011' }).success).toBe(false);
    expect(createDraftBody.safeParse({ title: 't', text: 'x', status: 'approved' }).success).toBe(false);
    expect(loginBody.safeParse({ email: 'a@b.test', password: 'p', role: 'admin' }).success).toBe(false);
  });
  it('requires a rationale to reject or request changes, but not to approve', () => {
    expect(draftDecisionBody.safeParse({ decision: 'approve' }).success).toBe(true);
    expect(draftDecisionBody.safeParse({ decision: 'reject' }).success).toBe(false);
    expect(draftDecisionBody.safeParse({ decision: 'request_changes', rationale: ' ' }).success).toBe(false);
    expect(draftDecisionBody.safeParse({ decision: 'reject', rationale: 'off-brand' }).success).toBe(true);
  });
  it('rejects bad ids (including 12-char strings that mongoose.isValid would accept)', () => {
    expect(() => assertObjectId('abcdefghijkl')).toThrow();
    expect(() => assertObjectId({ $ne: 1 })).toThrow();
    expect(() => assertObjectId('507f1f77bcf86cd799439011')).not.toThrow();
  });
  it('upload: allowlisted mime only, sha256 shaped, positive size', () => {
    const ok = { originalName: 'a.pdf', mime: 'application/pdf', size: 10, sha256: 'a'.repeat(64), extractionStatus: 'complete' };
    expect(uploadBody.safeParse(ok).success).toBe(true);
    expect(uploadBody.safeParse({ ...ok, mime: 'application/x-msdownload' }).success).toBe(false);
    expect(uploadBody.safeParse({ ...ok, sha256: 'zz' }).success).toBe(false);
    expect(uploadBody.safeParse({ ...ok, size: 0 }).success).toBe(false);
  });
  it('policy: literal phrases only, bounded', () => {
    const p = { ruleKey: 'r1', category: 'prohibited_phrase', text: 't', severity: 'high' };
    expect(policyBody.safeParse(p).success).toBe(true);
    expect(policyBody.safeParse({ ...p, phrases: Array(21).fill('x') }).success).toBe(false);
    expect(policyBody.safeParse({ ...p, ruleKey: 'has space' }).success).toBe(false);
  });
});
