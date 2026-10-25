import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { appendAuditEvent, listAuditEvents, verifyChain } from '../../src/audit/auditLog';
import { AuditEvent, Draft, Revision } from '../../src/models';
import * as drafts from '../../src/repositories/draftRepo';
import * as reviews from '../../src/repositories/reviewRepo';
import { buildFixture, clearDb, expectCode, startDb, stopDb, type Fixture } from '../helpers';

let f: Fixture;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => { await clearDb(); f = await buildFixture(); });

describe('audit trail (Gate 4) and hash chain', () => {
  it('records actor, action and timestamp for each step of the review workflow', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 't', text: 'x' });
    await drafts.submitDraft(f.alphaCreator, String(d._id));
    await reviews.decideDraft(f.alphaReviewer, String(d._id), { decision: 'approve' });
    const events = (await listAuditEvents(f.alphaAdmin)).reverse();
    expect(events.map((e) => e.action)).toEqual(['draft.created', 'draft.submitted', 'draft.approved']);
    expect(events[2].actorId?.toString()).toBe(f.ids.user3);
    expect(events[2].at).toBeInstanceOf(Date);
  });

  it('chain verifies, then detects a tampered event (raw driver edit) at the right seq', async () => {
    for (let i = 0; i < 4; i++) await appendAuditEvent({ workspaceId: f.ids.alpha, actorId: f.ids.user1, action: 'draft.created', meta: { i } });
    expect(await verifyChain(f.alphaAdmin)).toMatchObject({ ok: true, count: 4 });
    await mongoose.connection.collection('auditevents').updateOne({ workspaceId: new mongoose.Types.ObjectId(f.ids.alpha), seq: 3 }, { $set: { action: 'draft.approved' } });
    expect(await verifyChain(f.alphaAdmin)).toMatchObject({ ok: false, brokenAtSeq: 3 });
  });

  it('detects a deleted event (raw driver delete)', async () => {
    for (let i = 0; i < 4; i++) await appendAuditEvent({ workspaceId: f.ids.alpha, actorId: null, action: 'draft.created' });
    await mongoose.connection.collection('auditevents').deleteOne({ workspaceId: new mongoose.Types.ObjectId(f.ids.alpha), seq: 2 });
    expect(await verifyChain(f.alphaAdmin)).toMatchObject({ ok: false, brokenAtSeq: 2 });
  });

  it('concurrent writers never fork the chain', async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => appendAuditEvent({ workspaceId: f.ids.alpha, actorId: null, action: 'draft.created', meta: { i } })));
    const res = await verifyChain(f.alphaAdmin);
    expect(res).toMatchObject({ ok: true, count: 12 });
  });

  it('each workspace has its own independent chain', async () => {
    await appendAuditEvent({ workspaceId: f.ids.alpha, actorId: null, action: 'draft.created' });
    await appendAuditEvent({ workspaceId: f.ids.beta, actorId: null, action: 'draft.created' });
    const betaEvents = await AuditEvent.find({ workspaceId: f.ids.beta }).lean();
    expect(betaEvents).toHaveLength(1);
    expect(betaEvents[0].seq).toBe(1);
  });

  it('is append-only through Mongoose (update/delete/save-existing all throw)', async () => {
    await appendAuditEvent({ workspaceId: f.ids.alpha, actorId: null, action: 'draft.created' });
    await expect(AuditEvent.updateOne({ workspaceId: f.ids.alpha }, { $set: { action: 'x' } })).rejects.toThrow(/append-only/);
    await expect(AuditEvent.deleteMany({ workspaceId: f.ids.alpha })).rejects.toThrow(/append-only/);
    const doc = await AuditEvent.findOne({ workspaceId: f.ids.alpha });
    doc!.action = 'tampered';
    await expect(doc!.save()).rejects.toThrow(/append-only/);
  });

  it('revisions are immutable too', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 't', text: 'original' });
    await expect(Revision.updateOne({ draftId: d._id }, { $set: { text: 'changed' } })).rejects.toThrow(/append-only/);
  });

  it('only an admin can verify the chain', async () => {
    await expectCode(verifyChain(f.alphaReviewer), 'FORBIDDEN');
    await expectCode(verifyChain(f.alphaCreator), 'FORBIDDEN');
  });

  it('reviewers do not see events of unsubmitted drafts until submission; admins see all', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 'secret', text: 'x' });
    await drafts.reviseDraft(f.alphaCreator, String(d._id), { text: 'y' });
    expect((await listAuditEvents(f.alphaReviewer)).filter((e) => e.draftId)).toHaveLength(0);
    expect((await listAuditEvents(f.alphaAdmin)).filter((e) => e.draftId)).toHaveLength(2);
    await drafts.submitDraft(f.alphaCreator, String(d._id));
    expect((await listAuditEvents(f.alphaReviewer)).filter((e) => e.draftId)).toHaveLength(3); // created, revised, submitted
  });

  it('does not leak other workspaces\' events', async () => {
    await drafts.createDraft(f.betaCreator, { title: 'beta', text: 'x' });
    expect(await listAuditEvents(f.alphaAdmin)).toHaveLength(0);
  });
});

describe('draft integrity', () => {
  it('Draft.authorId and workspaceId are immutable', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 't', text: 'x' });
    await Draft.updateOne({ _id: d._id }, { $set: { authorId: f.ids.user3, workspaceId: f.ids.beta } }); // silently ignored by `immutable`
    const after = await Draft.findOne({ _id: d._id }).lean();
    expect(String(after!.authorId)).toBe(f.ids.user2);
    expect(String(after!.workspaceId)).toBe(f.ids.alpha);
  });
});
