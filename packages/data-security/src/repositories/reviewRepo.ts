import { appendAuditEvent } from '../audit/auditLog';
import { getEnv } from '../config/env';
import { conflict, notFound } from '../errors';
import { Analysis, Draft, Finding, ReviewDecision, type DraftRec, type FindingRec, type ReviewDecisionRec } from '../models';
import { assertCtx, type AccessContext } from '../security/context';
import { assertCan, assertCanDecide } from '../security/permissions';
import { assertTransition, DECISION_TO_STATUS } from '../security/stateMachine';
import { assertObjectId } from '../validation/ids';
import { draftDecisionBody, findingDecisionBody } from '../validation/schemas';
import { asRec, asRecs } from './common';
import { loadVisibleDraft } from './draftRepo';

/**
 * Decide on a whole draft. Enforced HERE (not in routes):
 *   role === reviewer  AND  actor !== draft.authorId  AND  draft.status === 'submitted'
 * The status change is a single conditional update (status:'submitted' is in the filter), so two reviewers racing
 * cannot both decide.
 */
export async function decideDraft(ctx: AccessContext, draftId: string, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'draft:decide');
  const body = draftDecisionBody.parse(input);
  const draft = await loadVisibleDraft(ctx, draftId);
  assertCanDecide(ctx.role, ctx.userId, draft); // role + separation of duties
  const next = DECISION_TO_STATUS[body.decision];
  assertTransition(draft.status, next); // draft -> approved etc. is impossible

  // Optional "no false green" rule: approval needs a COMPLETE analysis of the revision being approved.
  if (body.decision === 'approve' && getEnv().REQUIRE_COMPLETE_ANALYSIS_FOR_APPROVAL === 'on') {
    const latest = await Analysis.findOne({ workspaceId: ctx.workspaceId, draftId: draft._id, revisionId: draft.currentRevisionId }).sort({ createdAt: -1, _id: -1 }).lean();
    if (!latest || latest.status !== 'complete') throw conflict('Cannot approve: the latest analysis of this revision is missing or not complete');
  }

  const now = new Date();
  const updated = await Draft.findOneAndUpdate(
    { _id: draft._id, workspaceId: ctx.workspaceId, status: 'submitted' },
    { $set: { status: next, decidedAt: now } },
    { new: true },
  ).lean();
  if (!updated) throw conflict('The draft is no longer awaiting review');

  await ReviewDecision.create({
    workspaceId: ctx.workspaceId, draftId: draft._id, targetType: 'draft', targetId: draft._id,
    actorId: ctx.userId, decision: body.decision, rationale: body.rationale, at: now,
  });
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId,
    action: next === 'approved' ? 'draft.approved' : next === 'rejected' ? 'draft.rejected' : 'draft.changes_requested',
    targetType: 'draft', targetId: String(draft._id), draftId: String(draft._id),
    meta: { decision: body.decision, revision: draft.currentRevisionNo },
  });
  return asRec<DraftRec>(updated)!;
}

/** Accept or dismiss one finding. Same rules as decideDraft; the parent draft must be 'submitted'. A finding is decided once. */
export async function decideFinding(ctx: AccessContext, findingId: string, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'draft:decide');
  assertObjectId(findingId, 'findingId');
  const body = findingDecisionBody.parse(input);
  const finding = asRec<FindingRec>(await Finding.findOne({ _id: findingId, workspaceId: ctx.workspaceId }).lean());
  if (!finding) throw notFound('Finding');
  const draft = await loadVisibleDraft(ctx, String(finding.draftId)); // findings inherit the draft's visibility
  assertCanDecide(ctx.role, ctx.userId, draft);
  if (draft.status !== 'submitted') throw conflict('Findings can only be decided while the draft is awaiting review');

  const now = new Date();
  const disposition = body.decision === 'accept' ? 'accepted' : 'dismissed';
  const updated = await Finding.findOneAndUpdate(
    { _id: finding._id, workspaceId: ctx.workspaceId, disposition: 'open' },
    { $set: { disposition, decidedBy: ctx.userId, decidedAt: now } },
    { new: true },
  ).lean();
  if (!updated) throw conflict('This finding has already been decided');

  await ReviewDecision.create({
    workspaceId: ctx.workspaceId, draftId: draft._id, targetType: 'finding', targetId: finding._id,
    actorId: ctx.userId, decision: body.decision, rationale: body.rationale, at: now,
  });
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId,
    action: body.decision === 'accept' ? 'finding.accepted' : 'finding.dismissed',
    targetType: 'finding', targetId: String(finding._id), draftId: String(draft._id),
    meta: { severity: finding.severity, category: finding.category },
  });
  return asRec<FindingRec>(updated)!;
}

/** Decision history of a draft (and its findings). Visibility follows the draft. */
export async function listDecisions(ctx: AccessContext, draftId: string) {
  const draft = await loadVisibleDraft(ctx, draftId);
  return asRecs<ReviewDecisionRec>(await ReviewDecision.find({ draftId: draft._id, workspaceId: ctx.workspaceId }).sort({ at: 1 }).lean());
}
