/** Evidence validation, no-false-green analysis status, finding decisions, adversarial tests A2-A5 at the data layer. */
import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deriveAnalysisStatus } from '../../src/repositories/analysisRepo';
import * as analyses from '../../src/repositories/analysisRepo';
import * as drafts from '../../src/repositories/draftRepo';
import * as reviews from '../../src/repositories/reviewRepo';
import * as analytics from '../../src/repositories/analyticsRepo';
import { Policy } from '../../src/models';
import { buildFixture, clearDb, expectCode, startDb, stopDb, type Fixture } from '../helpers';

let f: Fixture;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => { await clearDb(); f = await buildFixture(); });

const finding = (over: Record<string, unknown> = {}) => ({
  category: 'prohibited_phrase', severity: 'high', source: 'deterministic', ruleKey: 'no-guaranteed',
  excerpt: 'guaranteed safe', explanation: 'Prohibited phrase', evidenceStatus: 'supported', ...over,
});
const setup = async () => {
  const d = await drafts.createDraft(f.alphaCreator, { title: 't', channel: 'web', text: 'guaranteed safe!' });
  const a = await analyses.startAnalysis(f.alphaCreator, String(d._id));
  return { draftId: String(d._id), analysisId: String(a._id) };
};

describe('analysis status can never be falsely green', () => {
  it('derives status from the check results', () => {
    expect(deriveAnalysisStatus({ deterministicStatus: 'complete', aiRequired: false, aiStatus: 'not_run', ocrStatus: 'not_applicable' })).toBe('complete');
    expect(deriveAnalysisStatus({ deterministicStatus: 'complete', aiRequired: true, aiStatus: 'unavailable', ocrStatus: 'not_applicable' })).toBe('incomplete');
    expect(deriveAnalysisStatus({ deterministicStatus: 'complete', aiRequired: false, aiStatus: 'timeout', ocrStatus: 'not_applicable' })).toBe('incomplete');
    expect(deriveAnalysisStatus({ deterministicStatus: 'complete', aiRequired: false, aiStatus: 'complete', ocrStatus: 'failed' })).toBe('incomplete');
    expect(deriveAnalysisStatus({ deterministicStatus: 'failed', aiRequired: false, aiStatus: 'complete', ocrStatus: 'complete' })).toBe('failed');
  });
  it('A4. provider unavailable: deterministic findings persist, analysis is "incomplete" not "complete"', async () => {
    const { analysisId } = await setup();
    await analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] })] });
    const done = await analyses.finalizeAnalysis(f.alphaCreator, analysisId, { deterministicStatus: 'complete', aiRequired: true, aiStatus: 'unavailable', errors: ['OpenRouter 503'] });
    expect(done.status).toBe('incomplete');
    await expectCode(analyses.finalizeAnalysis(f.alphaCreator, analysisId, { deterministicStatus: 'complete', aiRequired: false, aiStatus: 'complete' }), 'CONFLICT');
  });
  it('callers cannot smuggle a status in', async () => {
    const { analysisId } = await setup();
    await expect(analyses.finalizeAnalysis(f.alphaCreator, analysisId, { deterministicStatus: 'complete', aiRequired: true, aiStatus: 'failed', status: 'complete' } as any)).rejects.toThrow();
  });
});

describe('evidence validation', () => {
  it('accepts a pinned, same-workspace, current policy', async () => {
    const { analysisId, draftId } = await setup();
    await analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] })] });
    expect(await analyses.listFindings(f.alphaCreator, draftId)).toHaveLength(1);
  });
  it('A2. rejects a source from another workspace even though the id exists', async () => {
    const { analysisId } = await setup();
    await expectCode(analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: f.policyBeta }] })] }), 'EVIDENCE_INVALID');
  });
  it('rejects an id that was never retrieved for this analysis (hallucinated citation)', async () => {
    const { analysisId } = await setup();
    await expectCode(analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: String(new Types.ObjectId()) }] })] }), 'EVIDENCE_INVALID');
  });
  it('rejects a source retired after the analysis started from being cited as "supported", but allows "stale"', async () => {
    const { analysisId } = await setup();
    await Policy.updateOne({ _id: f.policyAlpha }, { $set: { status: 'retired', effectiveTo: new Date(Date.now() - 1000) } });
    await expectCode(analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] })] }), 'EVIDENCE_INVALID');
    await analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceStatus: 'stale', evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] })] });
  });
  it('structurally impossible statuses are refused', async () => {
    const { analysisId } = await setup();
    await expectCode(analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceStatus: 'supported', evidenceRefs: [] })] }), 'EVIDENCE_INVALID');
    await expectCode(analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceStatus: 'conflicting', evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] })] }), 'EVIDENCE_INVALID');
    await analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceStatus: 'unverified', evidenceRefs: [] })] }); // missing evidence stays "unverified", not "false"
  });
  it('A5. a suggestion is only "ready" if it was revalidated AND passed', async () => {
    const { analysisId, draftId } = await setup();
    await analyses.recordFindings(f.alphaCreator, analysisId, { findings: [
      finding({ evidenceStatus: 'unverified', suggestion: { text: 'safe', revalidated: true, revalidationPassed: false } }),
      finding({ evidenceStatus: 'unverified', suggestion: { text: 'fine', revalidated: true, revalidationPassed: true } }),
    ] });
    const fs = await analyses.listFindings(f.alphaCreator, draftId);
    expect(fs.map((x) => x.suggestion?.ready)).toEqual([false, true]);
  });
  it('only the author can start analyses or record findings (admin and others cannot)', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 't', text: 'x' });
    await expectCode(analyses.startAnalysis(f.alphaAdmin, String(d._id)), 'FORBIDDEN');
    await expectCode(analyses.startAnalysis(f.alphaReviewer, String(d._id)), 'NOT_FOUND'); // cannot even see it
  });
});

describe('finding decisions and analytics', () => {
  it('reviewer accepts/dismisses a finding once; creators cannot; the author-reviewer cannot', async () => {
    const { analysisId, draftId } = await setup();
    await analyses.recordFindings(f.alphaCreator, analysisId, { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] }), finding({ category: 'terminology', evidenceStatus: 'unverified' })] });
    await analyses.finalizeAnalysis(f.alphaCreator, analysisId, { deterministicStatus: 'complete', aiRequired: false, aiStatus: 'not_run' });
    const [first, second] = await analyses.listFindings(f.alphaCreator, draftId);
    await expectCode(reviews.decideFinding(f.alphaReviewer, String(first._id), { decision: 'accept' }), 'NOT_FOUND'); // unsubmitted: invisible
    await drafts.submitDraft(f.alphaCreator, draftId);
    await expectCode(reviews.decideFinding(f.alphaCreator, String(first._id), { decision: 'accept' }), 'FORBIDDEN');
    expect((await reviews.decideFinding(f.alphaReviewer, String(first._id), { decision: 'accept' })).disposition).toBe('accepted');
    await expectCode(reviews.decideFinding(f.alphaReviewer, String(first._id), { decision: 'dismiss' }), 'CONFLICT');
    expect((await reviews.decideFinding(f.alphaReviewer, String(second._id), { decision: 'dismiss' })).disposition).toBe('dismissed');
  });
  it('dashboard and recurrence derive from saved findings; reviewers never see unsubmitted drafts\' data', async () => {
    for (let i = 0; i < 2; i++) {
      const d = await drafts.createDraft(f.alphaCreator, { title: `d${i}`, text: 'guaranteed safe' });
      const a = await analyses.startAnalysis(f.alphaCreator, String(d._id));
      await analyses.recordFindings(f.alphaCreator, String(a._id), { findings: [finding({ evidenceRefs: [{ kind: 'policy', refId: f.policyAlpha }] })] });
      if (i === 0) await drafts.submitDraft(f.alphaCreator, String(d._id)); // d1 stays unsubmitted
    }
    const reviewerView = await analytics.summary(f.alphaReviewer);
    expect(reviewerView.findingsBySeverity).toEqual({ high: 1 });
    expect(reviewerView.draftsByStatus).toEqual({ submitted: 1 });
    expect(reviewerView.recurring).toEqual([]); // only 1 visible draft
    const adminView = await analytics.summary(f.alphaAdmin);
    expect(adminView.findingsBySeverity).toEqual({ high: 2 });
    expect(adminView.recurring[0]).toMatchObject({ category: 'prohibited_phrase', ruleKey: 'no-guaranteed', draftCount: 2 });
  });
});
