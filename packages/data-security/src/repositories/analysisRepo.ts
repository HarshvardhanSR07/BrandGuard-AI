import { Types } from 'mongoose';
import { appendAuditEvent } from '../audit/auditLog';
import { conflict, evidenceInvalid, forbidden, notFound } from '../errors';
import {
  Analysis, ApprovedFact, Finding, Policy,
  type AnalysisRec, type DraftRec, type FindingRec, type PinnedSource,
} from '../models';
import { assertCtx, type AccessContext } from '../security/context';
import { assertCan, canAuthorAct } from '../security/permissions';
import { isEditable } from '../security/stateMachine';
import { assertObjectId } from '../validation/ids';
import { finalizeAnalysisBody, recordFindingsBody } from '../validation/schemas';
import type { AnalysisStatus } from '../types';
import { asRec, asRecs, isCurrent, T } from './common';
import { loadVisibleDraft } from './draftRepo';

/** Author-only (so Admins and other users cannot start analyses on someone's draft). */
async function loadAuthoredDraft(ctx: AccessContext, draftId: string): Promise<DraftRec> {
  const draft = await loadVisibleDraft(ctx, draftId);
  if (!canAuthorAct(ctx.role, ctx.userId, draft, 'analysis:run')) throw forbidden('Only the author can analyse this draft');
  if (!isEditable(draft.status)) throw conflict(`A draft in status "${draft.status}" can no longer be analysed`);
  return draft;
}

/**
 * Starts an analysis of the draft's CURRENT revision and PINS the exact policy/fact versions in force right now.
 * Findings may later cite only these pinned sources (stops a model from citing records that were never retrieved).
 */
export async function startAnalysis(ctx: AccessContext, draftId: string) {
  assertCtx(ctx);
  assertCan(ctx.role, 'analysis:run');
  const draft = await loadAuthoredDraft(ctx, draftId);
  const now = new Date();
  const currentFilter = {
    workspaceId: ctx.workspaceId, status: 'active', effectiveFrom: T({ $lte: now }),
    $or: [{ effectiveTo: null }, { effectiveTo: T({ $gt: now }) }],
  };
  const [policies, facts] = await Promise.all([Policy.find(currentFilter).lean(), ApprovedFact.find(currentFilter).lean()]);
  const pinnedSources: PinnedSource[] = [
    ...policies.map((p) => ({ kind: 'policy' as const, refId: p._id, key: p.ruleKey, version: p.version })),
    ...facts.map((f) => ({ kind: 'fact' as const, refId: f._id, key: f.factKey, version: f.version })),
  ];
  const analysis = await Analysis.create({
    workspaceId: ctx.workspaceId, draftId: draft._id, revisionId: draft.currentRevisionId,
    requestedBy: ctx.userId, status: 'pending', pinnedSources,
  });
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'analysis.started',
    targetType: 'analysis', targetId: String(analysis._id), draftId: String(draft._id),
    meta: { revision: draft.currentRevisionNo, policies: policies.length, facts: facts.length },
  });
  return analysis.toObject();
}

async function loadPendingAnalysis(ctx: AccessContext, analysisId: string): Promise<AnalysisRec> {
  assertObjectId(analysisId, 'analysisId');
  const analysis = asRec<AnalysisRec>(await Analysis.findOne({ _id: analysisId, workspaceId: ctx.workspaceId }).lean());
  if (!analysis) throw notFound('Analysis');
  await loadAuthoredDraft(ctx, String(analysis.draftId)); // visibility + author + editable state
  if (analysis.status !== 'pending') throw conflict('This analysis is already finalised');
  return analysis;
}

/**
 * Persists findings for a PENDING analysis. Evidence rules enforced here (the model's output is untrusted):
 *  1. every cited source must be one of the analysis' pinned sources (so it was actually retrieved),
 *  2. it must still exist in THIS workspace,
 *  3. 'supported'/'contradicted' require at least one reference and every reference must be current; 'stale' and
 *     'conflicting' also require references ('conflicting' needs at least two),
 *  4. a suggestion is only marked `ready` if it was revalidated and the revalidation passed.
 * A valid id alone is NOT proof of support: the evidence/AI module decides the status, this layer only refuses
 * statuses that are structurally impossible.
 */
export async function recordFindings(ctx: AccessContext, analysisId: string, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'analysis:run');
  const { findings } = recordFindingsBody.parse(input);
  const analysis = await loadPendingAnalysis(ctx, analysisId);
  const pinned = new Map(analysis.pinnedSources.map((p) => [`${p.kind}:${p.refId}`, p]));
  const now = new Date();

  const docs = [];
  for (const [i, f] of findings.entries()) {
    const refs = [];
    for (const r of f.evidenceRefs) {
      const p = pinned.get(`${r.kind}:${r.refId.toLowerCase()}`);
      if (!p) throw evidenceInvalid(`finding[${i}]: ${r.kind} ${r.refId} was not among the sources retrieved for this analysis`);
      const record =
        r.kind === 'policy'
          ? await Policy.findOne({ _id: r.refId, workspaceId: ctx.workspaceId }).lean()
          : await ApprovedFact.findOne({ _id: r.refId, workspaceId: ctx.workspaceId }).lean();
      if (!record) throw evidenceInvalid(`finding[${i}]: cited ${r.kind} does not exist in this workspace`);
      if (['supported', 'contradicted'].includes(f.evidenceStatus) && !isCurrent(record, now)) {
        throw evidenceInvalid(`finding[${i}]: a retired or expired source cannot make a finding "${f.evidenceStatus}" (use "stale")`);
      }
      refs.push({ kind: r.kind, refId: new Types.ObjectId(r.refId), key: p.key, version: p.version });
    }
    if (['supported', 'contradicted', 'stale', 'conflicting'].includes(f.evidenceStatus) && refs.length === 0) {
      throw evidenceInvalid(`finding[${i}]: status "${f.evidenceStatus}" requires at least one evidence reference`);
    }
    if (f.evidenceStatus === 'conflicting' && refs.length < 2) {
      throw evidenceInvalid(`finding[${i}]: "conflicting" requires at least two evidence references`);
    }
    docs.push({
      workspaceId: ctx.workspaceId, draftId: analysis.draftId, revisionId: analysis.revisionId, analysisId: analysis._id,
      category: f.category, severity: f.severity, source: f.source, ruleKey: f.ruleKey, excerpt: f.excerpt,
      startOffset: f.startOffset, endOffset: f.endOffset, explanation: f.explanation, evidenceRefs: refs,
      evidenceStatus: f.evidenceStatus, uncertainty: f.uncertainty,
      suggestion: f.suggestion ? { ...f.suggestion, ready: f.suggestion.revalidated && f.suggestion.revalidationPassed } : undefined,
      disposition: 'open',
    });
  }
  const created = docs.length ? await Finding.insertMany(docs) : [];
  return { inserted: created.length };
}

/** Pure rule: a check that did not complete can NEVER yield a "complete" (green) analysis. */
export function deriveAnalysisStatus(i: {
  deterministicStatus: 'complete' | 'failed'; aiRequired: boolean; aiStatus: string; ocrStatus: string;
}): AnalysisStatus {
  if (i.deterministicStatus === 'failed') return 'failed';
  if (i.aiRequired && i.aiStatus !== 'complete') return 'incomplete';
  if (['unavailable', 'timeout', 'failed'].includes(i.aiStatus)) return 'incomplete';
  if (['failed', 'incomplete'].includes(i.ocrStatus)) return 'incomplete';
  return 'complete';
}

/** The status is COMPUTED here from the check results; the caller cannot assert "complete". */
export async function finalizeAnalysis(ctx: AccessContext, analysisId: string, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'analysis:run');
  const body = finalizeAnalysisBody.parse(input);
  const analysis = await loadPendingAnalysis(ctx, analysisId);
  const status = deriveAnalysisStatus(body);
  const updated = await Analysis.findOneAndUpdate(
    { _id: analysis._id, workspaceId: ctx.workspaceId, status: 'pending' },
    { $set: { status, aiStatus: body.aiStatus, ocrStatus: body.ocrStatus, errors: body.errors, finishedAt: new Date() } },
    { new: true },
  ).lean();
  if (!updated) throw conflict('This analysis is already finalised');
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'analysis.finished',
    targetType: 'analysis', targetId: String(analysis._id), draftId: String(analysis.draftId),
    meta: { status, aiStatus: body.aiStatus, ocrStatus: body.ocrStatus },
  });
  return asRec<AnalysisRec>(updated)!;
}

export async function getAnalysis(ctx: AccessContext, analysisId: string) {
  assertCtx(ctx);
  assertObjectId(analysisId, 'analysisId');
  const analysis = asRec<AnalysisRec>(await Analysis.findOne({ _id: analysisId, workspaceId: ctx.workspaceId }).lean());
  if (!analysis) throw notFound('Analysis');
  await loadVisibleDraft(ctx, String(analysis.draftId)); // same visibility as the draft
  return analysis;
}

export async function listAnalyses(ctx: AccessContext, draftId: string) {
  const draft = await loadVisibleDraft(ctx, draftId);
  return asRecs<AnalysisRec>(await Analysis.find({ draftId: draft._id, workspaceId: ctx.workspaceId }).sort({ createdAt: -1 }).lean());
}

export async function listFindings(ctx: AccessContext, draftId: string, opts: { revisionId?: string } = {}) {
  const draft = await loadVisibleDraft(ctx, draftId);
  const filter: Record<string, unknown> = { draftId: draft._id, workspaceId: ctx.workspaceId };
  if (opts.revisionId) filter.revisionId = assertObjectId(opts.revisionId, 'revisionId');
  return asRecs<FindingRec>(await Finding.find(filter).sort({ createdAt: 1, _id: 1 }).lean());
}
