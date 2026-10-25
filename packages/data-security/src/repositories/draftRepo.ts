import { Types } from 'mongoose';
import { appendAuditEvent } from '../audit/auditLog';
import { conflict, forbidden, notFound } from '../errors';
import { Draft, Revision, type DraftRec, type RevisionRec } from '../models';
import { assertCtx, type AccessContext } from '../security/context';
import { assertCan, canAuthorAct, canReadDraft } from '../security/permissions';
import { assertTransition, EDITABLE_STATUSES, isEditable, SUBMITTED_PLUS } from '../security/stateMachine';
import { assertObjectId } from '../validation/ids';
import { createDraftBody, listDraftsQuery, reviseDraftBody } from '../validation/schemas';
import { asRec, asRecs, sha256, T } from './common';

/**
 * Loads a draft the caller is allowed to SEE. "Does not exist", "is in another workspace" and "exists but is an
 * unsubmitted draft of someone else" are indistinguishable: all are 404.
 * Exported for other repositories (analysis, findings, review, uploads) that hang off a draft.
 */
export async function loadVisibleDraft(ctx: AccessContext, draftId: string): Promise<DraftRec> {
  assertCtx(ctx);
  assertObjectId(draftId, 'draftId');
  const draft = asRec<DraftRec>(await Draft.findOne({ _id: draftId, workspaceId: ctx.workspaceId }).lean());
  if (!draft || !canReadDraft(ctx.role, ctx.userId, draft)) throw notFound('Draft');
  return draft;
}

export async function createDraft(ctx: AccessContext, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'draft:create'); // admins cannot author (locked decision)
  const body = createDraftBody.parse(input);
  const draftId = new Types.ObjectId();
  const revisionId = new Types.ObjectId();

  await Draft.create({
    _id: draftId, workspaceId: ctx.workspaceId, authorId: ctx.userId, title: body.title, channel: body.channel,
    status: 'draft', currentRevisionId: revisionId, currentRevisionNo: 1,
  });
  try {
    await Revision.create({
      _id: revisionId, workspaceId: ctx.workspaceId, draftId, n: 1, text: body.text,
      contentHash: sha256(body.text), authorId: ctx.userId, source: 'manual',
    });
  } catch (err) {
    await Draft.deleteOne({ _id: draftId, workspaceId: ctx.workspaceId }); // do not leave a draft without its revision
    throw err;
  }
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'draft.created',
    targetType: 'draft', targetId: String(draftId), draftId: String(draftId), meta: { channel: body.channel },
  });
  return loadVisibleDraft(ctx, String(draftId));
}

export async function getDraft(ctx: AccessContext, draftId: string) {
  assertCan(ctx.role, 'draft:read');
  return loadVisibleDraft(ctx, draftId);
}

/** Admin: all drafts. Everyone else: own drafts in any state + everyone's drafts once submitted. */
export async function listDrafts(ctx: AccessContext, query: unknown = {}) {
  assertCtx(ctx);
  assertCan(ctx.role, 'draft:read');
  const q = listDraftsQuery.parse(query);
  const filter: Record<string, unknown> = { workspaceId: ctx.workspaceId };
  if (ctx.role !== 'admin') {
    filter.$or = [{ authorId: ctx.userId }, { status: T({ $in: [...SUBMITTED_PLUS] }) }];
  }
  if (q.status) filter.status = q.status; // note: an equality on `status` ANDs with the visibility $or
  if (q.mine) filter.authorId = ctx.userId;
  return asRecs<DraftRec>(await Draft.find(filter).sort({ createdAt: -1 }).skip(q.skip).limit(q.limit).lean());
}

/** Latest revision, or a specific one. Visibility follows the draft. */
export async function getRevision(ctx: AccessContext, draftId: string, n?: number) {
  const draft = await loadVisibleDraft(ctx, draftId);
  const revNo = n ?? draft.currentRevisionNo;
  if (!Number.isInteger(revNo) || revNo < 1) throw notFound('Revision');
  const rev = asRec<RevisionRec>(await Revision.findOne({ draftId: draft._id, workspaceId: ctx.workspaceId, n: revNo }).lean());
  if (!rev) throw notFound('Revision');
  return rev;
}

export async function listRevisions(ctx: AccessContext, draftId: string) {
  const draft = await loadVisibleDraft(ctx, draftId);
  return asRecs<RevisionRec>(await Revision.find({ draftId: draft._id, workspaceId: ctx.workspaceId }).sort({ n: 1 }).lean());
}

/** Author only, only while status is draft or changes_requested. Creates a new immutable revision. */
export async function reviseDraft(ctx: AccessContext, draftId: string, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'draft:edit');
  const body = reviseDraftBody.parse(input);
  const draft = await loadVisibleDraft(ctx, draftId); // 404 if it is someone else's unsubmitted draft
  if (!canAuthorAct(ctx.role, ctx.userId, draft, 'draft:edit')) throw forbidden('Only the author can edit this draft');
  if (!isEditable(draft.status)) throw conflict(`A draft in status "${draft.status}" can no longer be edited`);

  const nextNo = draft.currentRevisionNo + 1;
  const nextId = new Types.ObjectId();
  // Atomic claim: succeeds only if nobody changed the draft since we read it (optimistic concurrency).
  const claimed = await Draft.findOneAndUpdate(
    { _id: draft._id, workspaceId: ctx.workspaceId, authorId: ctx.userId, status: T({ $in: [...EDITABLE_STATUSES] }), currentRevisionNo: draft.currentRevisionNo },
    { $set: { currentRevisionNo: nextNo, currentRevisionId: nextId } },
    { new: true },
  ).lean();
  if (!claimed) throw conflict('The draft changed while you were editing; reload and retry');

  try {
    await Revision.create({
      _id: nextId, workspaceId: ctx.workspaceId, draftId: draft._id, n: nextNo, text: body.text,
      contentHash: sha256(body.text), authorId: ctx.userId, source: body.source, uploadId: body.uploadId ?? null,
    });
  } catch (err) {
    await Draft.updateOne({ _id: draft._id, workspaceId: ctx.workspaceId }, { $set: { currentRevisionNo: draft.currentRevisionNo, currentRevisionId: draft.currentRevisionId } });
    throw err;
  }
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'draft.revised',
    targetType: 'draft', targetId: String(draft._id), draftId: String(draft._id), meta: { revision: nextNo },
  });
  return loadVisibleDraft(ctx, draftId);
}

/** draft | changes_requested -> submitted. Author only. */
export async function submitDraft(ctx: AccessContext, draftId: string) {
  assertCtx(ctx);
  assertCan(ctx.role, 'draft:submit');
  const draft = await loadVisibleDraft(ctx, draftId);
  if (!canAuthorAct(ctx.role, ctx.userId, draft, 'draft:submit')) throw forbidden('Only the author can submit this draft');
  assertTransition(draft.status, 'submitted');

  const updated = await Draft.findOneAndUpdate(
    { _id: draft._id, workspaceId: ctx.workspaceId, authorId: ctx.userId, status: draft.status }, // status in filter = atomic transition
    { $set: { status: 'submitted', submittedAt: new Date(), decidedAt: null } },
    { new: true },
  ).lean();
  if (!updated) throw conflict('The draft changed state; reload and retry');
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'draft.submitted',
    targetType: 'draft', targetId: String(draft._id), draftId: String(draft._id), meta: { revision: draft.currentRevisionNo },
  });
  return asRec<DraftRec>(updated)!;
}
