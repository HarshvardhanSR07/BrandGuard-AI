import { invalidTransition } from '../errors';
import type { DraftDecision, DraftStatus } from '../types';

/**
 *   draft --submit--> submitted --approve--------> approved   (terminal)
 *                               --reject---------> rejected   (terminal)
 *                               --request_changes-> changes_requested --(author edits)--> --submit--> submitted
 * No `in_review` state (locked decision). Reviewers act directly on `submitted`.
 */
export const TRANSITIONS: Readonly<Record<DraftStatus, readonly DraftStatus[]>> = {
  draft: ['submitted'],
  submitted: ['approved', 'rejected', 'changes_requested'],
  changes_requested: ['submitted'],
  approved: [],
  rejected: [],
};

/** States in which the author may still edit (each edit creates a new immutable revision). */
export const EDITABLE_STATUSES: readonly DraftStatus[] = ['draft', 'changes_requested'];
/** States that count as "has been submitted" (visible to reviewers / analytics for non-admins). */
export const SUBMITTED_PLUS: readonly DraftStatus[] = ['submitted', 'approved', 'rejected', 'changes_requested'];

export const DECISION_TO_STATUS: Readonly<Record<DraftDecision, DraftStatus>> = {
  approve: 'approved',
  reject: 'rejected',
  request_changes: 'changes_requested',
};

export function canTransition(from: DraftStatus, to: DraftStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: DraftStatus, to: DraftStatus): void {
  if (!canTransition(from, to)) throw invalidTransition(from, to);
}

export const isEditable = (s: DraftStatus): boolean => EDITABLE_STATUSES.includes(s);
