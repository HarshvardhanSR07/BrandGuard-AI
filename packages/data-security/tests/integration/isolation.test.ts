/** Locked test matrix (v3 plan) + the five must-run adversarial tests from the roadmap. */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Draft } from '../../src/models';
import * as drafts from '../../src/repositories/draftRepo';
import * as reviews from '../../src/repositories/reviewRepo';
import * as analyses from '../../src/repositories/analysisRepo';
import * as analytics from '../../src/repositories/analyticsRepo';
import { resolveAccessContext } from '../../src/security/context';
import { assertTransition } from '../../src/security/stateMachine';
import { buildFixture, clearDb, expectCode, startDb, stopDb, type Fixture } from '../helpers';

let f: Fixture;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => { await clearDb(); f = await buildFixture(); });

const draftInput = { title: 'Launch', channel: 'social', text: 'Hello world' };

describe('matrix tests 1-9', () => {
  it('1. Alpha admin reads an unsubmitted draft but cannot edit it', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    expect((await drafts.getDraft(f.alphaAdmin, String(d._id))).status).toBe('draft');
    await expectCode(drafts.reviseDraft(f.alphaAdmin, String(d._id), { text: 'tampered' }), 'FORBIDDEN');
    await expectCode(drafts.submitDraft(f.alphaAdmin, String(d._id)), 'FORBIDDEN');
  });

  it('2. ID substitution: same user under Beta gets 404 for an Alpha draft id', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    await expectCode(drafts.getDraft(f.betaCreator, String(d._id)), 'NOT_FOUND');
    await expectCode(drafts.getRevision(f.betaCreator, String(d._id)), 'NOT_FOUND');
    await expectCode(analyses.listFindings(f.betaReviewer, String(d._id)), 'NOT_FOUND');
  });

  it('3. a reviewer is denied when reviewing their own draft', async () => {
    const d = await drafts.createDraft(f.alphaReviewer, draftInput);
    await drafts.submitDraft(f.alphaReviewer, String(d._id));
    await expectCode(reviews.decideDraft(f.alphaReviewer, String(d._id), { decision: 'approve' }), 'SELF_REVIEW_FORBIDDEN');
  });

  it('4. a reviewer cannot read another user\'s unsubmitted draft', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    await expectCode(drafts.getDraft(f.alphaReviewer, String(d._id)), 'NOT_FOUND');
    expect(await drafts.listDrafts(f.alphaReviewer)).toHaveLength(0);
  });

  it('5. a reviewer decides on another user\'s submitted draft', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    await drafts.submitDraft(f.alphaCreator, String(d._id));
    const r = await reviews.decideDraft(f.alphaReviewer, String(d._id), { decision: 'approve' });
    expect(r.status).toBe('approved');
    expect(await reviews.listDecisions(f.alphaReviewer, String(d._id))).toHaveLength(1);
  });

  it('6. draft -> approved jump is impossible', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    await expectCode(reviews.decideDraft(f.alphaReviewer, String(d._id), { decision: 'approve' }), 'NOT_FOUND'); // not even visible yet
    // the state machine itself refuses the jump:
    expect(() => assertTransition('draft', 'approved')).toThrow();
    // and a conditional update on a non-submitted draft changes nothing:
    const res = await Draft.updateOne({ _id: d._id, workspaceId: f.ids.alpha, status: 'submitted' }, { $set: { status: 'approved' } });
    expect(res.modifiedCount).toBe(0);
  });

  it('7. a creator calling review / analytics / audit is denied', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    await drafts.submitDraft(f.alphaCreator, String(d._id));
    await expectCode(reviews.decideDraft(f.alphaCreator, String(d._id), { decision: 'approve' }), 'FORBIDDEN');
    await expectCode(analytics.summary(f.alphaCreator), 'FORBIDDEN');
    const { listAuditEvents } = await import('../../src/audit/auditLog');
    await expectCode(listAuditEvents(f.alphaCreator), 'FORBIDDEN');
  });

  it('8. {"$ne": null} in a string field is rejected', async () => {
    await expect(drafts.createDraft(f.alphaCreator, { title: { $ne: null }, text: 'x' })).rejects.toThrow();
    await expect(drafts.getDraft(f.alphaCreator, { $ne: null } as any)).rejects.toThrow();
  });

  it('9. role comes from the database, never from the token: no membership => no context', async () => {
    await expectCode(resolveAccessContext(f.ids.user2, f.ids.beta), 'FORBIDDEN'); // user2 is not in Beta
    await expectCode(resolveAccessContext(f.ids.user4, f.ids.alpha), 'FORBIDDEN'); // user4 is not in Alpha
    await expectCode(resolveAccessContext(f.ids.user2, 'not-an-id'), 'VALIDATION');
  });
});

describe('forged contexts and edit rules', () => {
  it('a hand-built context object is rejected', async () => {
    const forged: any = { userId: f.ids.user2, workspaceId: f.ids.alpha, role: 'admin' };
    await expect(drafts.listDrafts(forged)).rejects.toThrow(/Invalid AccessContext/);
  });
  it('only the author edits; edits create immutable revisions; submitted drafts are frozen', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    const id = String(d._id);
    await drafts.reviseDraft(f.alphaCreator, id, { text: 'v2' });
    expect((await drafts.listRevisions(f.alphaCreator, id)).map((r) => r.n)).toEqual([1, 2]);
    await drafts.submitDraft(f.alphaCreator, id);
    await expectCode(drafts.reviseDraft(f.alphaCreator, id, { text: 'v3' }), 'CONFLICT');
    // another creator/reviewer who can now see it still cannot edit:
    await expectCode(drafts.reviseDraft(f.alphaReviewer, id, { text: 'x' }), 'FORBIDDEN');
  });
  it('changes_requested lets the author revise and resubmit; approved is terminal', async () => {
    const d = await drafts.createDraft(f.alphaCreator, draftInput);
    const id = String(d._id);
    await drafts.submitDraft(f.alphaCreator, id);
    await reviews.decideDraft(f.alphaReviewer, id, { decision: 'request_changes', rationale: 'fix tone' });
    await drafts.reviseDraft(f.alphaCreator, id, { text: 'better' });
    await drafts.submitDraft(f.alphaCreator, id);
    await reviews.decideDraft(f.alphaReviewer, id, { decision: 'approve' });
    await expectCode(reviews.decideDraft(f.alphaReviewer, id, { decision: 'reject', rationale: 'late' }), 'INVALID_TRANSITION');
    await expectCode(drafts.reviseDraft(f.alphaCreator, id, { text: 'x' }), 'CONFLICT');
  });
  it('an admin cannot create drafts', async () => {
    await expectCode(drafts.createDraft(f.alphaAdmin, draftInput), 'FORBIDDEN');
  });
});

describe('roadmap adversarial tests', () => {
  it('A1. Creator in Workspace A substitutes a draft ID from Workspace B: no private data returned', async () => {
    const betaDraft = await drafts.createDraft(f.betaCreator, draftInput); // user1 as Beta creator
    await expectCode(drafts.getDraft(f.alphaCreator, String(betaDraft._id)), 'NOT_FOUND');
    await expectCode(drafts.getRevision(f.alphaCreator, String(betaDraft._id)), 'NOT_FOUND');
    await expectCode(drafts.reviseDraft(f.alphaCreator, String(betaDraft._id), { text: 'x' }), 'NOT_FOUND');
  });
  it('A2. cross-workspace analytics only count the caller\'s workspace', async () => {
    const b = await drafts.createDraft(f.betaCreator, draftInput);
    await drafts.submitDraft(f.betaCreator, String(b._id));
    const s = await analytics.summary(f.alphaReviewer);
    expect(s.draftsByStatus).toEqual({});
  });
});
