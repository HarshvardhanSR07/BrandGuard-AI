/**
 * THE role x action matrix. Pure functions, no I/O, deny by default.
 * Resource-level rules (own draft, not-your-own-review, visibility) live below the matrix and are also pure,
 * so they can be unit-tested without a database.
 */
import { forbidden, selfReview } from '../errors';
import type { DraftStatus, Role } from '../types';

export const ACTIONS = [
  'policy:read', 'policy:manage', 'fact:read', 'fact:manage', 'membership:manage',
  'draft:create', 'draft:edit', 'draft:submit', 'draft:read', 'draft:decide',
  'analysis:run', 'upload:create', 'analytics:read', 'audit:read',
] as const;
export type Action = (typeof ACTIONS)[number];

const common: Action[] = ['policy:read', 'fact:read', 'draft:read'];
const authoring: Action[] = ['draft:create', 'draft:edit', 'draft:submit', 'analysis:run', 'upload:create'];

const MATRIX: Record<Role, ReadonlySet<Action>> = {
  // Admin: governs the workspace, reads everything, never authors or reviews content.
  admin: new Set<Action>([...common, 'policy:manage', 'fact:manage', 'membership:manage', 'analytics:read', 'audit:read']),
  // Creator: authors content. No analytics, no audit, no decisions.
  creator: new Set<Action>([...common, ...authoring]),
  // Reviewer: may also author (locked decision, so self-review is testable) and decide on others' drafts.
  reviewer: new Set<Action>([...common, ...authoring, 'draft:decide', 'analytics:read', 'audit:read']),
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role]?.has(action) ?? false;
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) throw forbidden();
}

// ---------- resource-level rules ----------

export interface DraftLike {
  authorId: unknown;
  status: DraftStatus;
}
const same = (a: unknown, b: unknown) => String(a) === String(b);

/**
 * Visibility of a draft (and everything hanging off it: revisions, analyses, findings, uploads, audit events):
 *  - Admin: everything (read-only oversight).
 *  - Author: their own drafts in any state.
 *  - Everyone else: only once the draft has been submitted (status !== 'draft').
 */
export function canReadDraft(role: Role, userId: string, draft: DraftLike): boolean {
  if (!can(role, 'draft:read')) return false;
  if (role === 'admin') return true;
  if (same(draft.authorId, userId)) return true;
  return draft.status !== 'draft';
}

/** Authoring actions (edit / submit / analyse / attach upload): author only, whatever the role. Admin never has them. */
export function canAuthorAct(role: Role, userId: string, draft: DraftLike, action: 'draft:edit' | 'draft:submit' | 'analysis:run' | 'upload:create'): boolean {
  return can(role, action) && same(draft.authorId, userId);
}

/** Deciding on a draft or one of its findings. Separation of duties is enforced here. */
export function assertCanDecide(role: Role, userId: string, draft: DraftLike): void {
  assertCan(role, 'draft:decide');
  if (same(draft.authorId, userId)) throw selfReview();
}
