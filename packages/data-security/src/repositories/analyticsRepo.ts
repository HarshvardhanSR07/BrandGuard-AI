import { Finding, Draft } from '../models';
import { assertCtx, wsObjectId, type AccessContext } from '../security/context';
import { assertCan } from '../security/permissions';
import { SUBMITTED_PLUS } from '../security/stateMachine';

/**
 * Every pipeline starts with $match on workspaceId (an ObjectId: aggregate does not cast strings).
 * No stored counters: everything derives from persisted findings/drafts (Gate 5).
 * Only findings of each draft's CURRENT revision are counted.
 * Reviewers never see data from unsubmitted drafts (locked decision); admins see everything.
 */
function baseFindingPipeline(ctx: AccessContext): any[] {
  const ws = wsObjectId(ctx);
  const pipeline: any[] = [
    { $match: { workspaceId: ws } },
    { $lookup: { from: Draft.collection.name, localField: 'draftId', foreignField: '_id', as: 'd' } },
    { $unwind: '$d' },
    { $match: { $expr: { $and: [{ $eq: ['$d.workspaceId', ws] }, { $eq: ['$revisionId', '$d.currentRevisionId'] }] } } },
  ];
  if (ctx.role !== 'admin') pipeline.push({ $match: { 'd.status': { $in: [...SUBMITTED_PLUS] } } });
  return pipeline;
}

export async function summary(ctx: AccessContext) {
  assertCtx(ctx);
  assertCan(ctx.role, 'analytics:read');
  const ws = wsObjectId(ctx);

  const draftMatch: Record<string, unknown> = { workspaceId: ws };
  if (ctx.role !== 'admin') draftMatch.status = { $in: [...SUBMITTED_PLUS] };

  const [draftsByStatus, bySeverity, byDisposition, byEvidenceStatus, recurring] = await Promise.all([
    Draft.aggregate([{ $match: draftMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Finding.aggregate([...baseFindingPipeline(ctx), { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Finding.aggregate([...baseFindingPipeline(ctx), { $group: { _id: '$disposition', count: { $sum: 1 } } }]),
    Finding.aggregate([...baseFindingPipeline(ctx), { $group: { _id: '$evidenceStatus', count: { $sum: 1 } } }]),
    recurringIssues(ctx),
  ]);
  const toMap = (rows: Array<{ _id: string; count: number }>) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return {
    draftsByStatus: toMap(draftsByStatus),
    findingsBySeverity: toMap(bySeverity),
    findingsByDisposition: toMap(byDisposition),
    findingsByEvidenceStatus: toMap(byEvidenceStatus),
    recurring,
  };
}

/** An issue type "recurs" when it appears in 2+ distinct drafts. Counts are hypotheses' raw material, not causes. */
export async function recurringIssues(ctx: AccessContext, minDrafts = 2) {
  assertCtx(ctx);
  assertCan(ctx.role, 'analytics:read');
  const rows = await Finding.aggregate([
    ...baseFindingPipeline(ctx),
    {
      $group: {
        _id: { category: '$category', ruleKey: { $ifNull: ['$ruleKey', null] } },
        drafts: { $addToSet: '$draftId' },
        findings: { $sum: 1 },
      },
    },
    { $project: { _id: 0, category: '$_id.category', ruleKey: '$_id.ruleKey', findings: 1, draftCount: { $size: '$drafts' } } },
    { $match: { draftCount: { $gte: minDrafts } } },
    { $sort: { draftCount: -1, findings: -1 } },
    { $limit: 50 },
  ]);
  return rows as Array<{ category: string; ruleKey: string | null; findings: number; draftCount: number }>;
}
