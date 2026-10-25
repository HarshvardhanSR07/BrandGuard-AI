import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createAuthRouter } from '../../src/http/authRouter';
import { asyncHandler, authenticate, errorHandler, getCtx, requirePermission, workspaceContext } from '../../src/http/middleware';
import { User } from '../../src/models';
import * as drafts from '../../src/repositories/draftRepo';
import * as reviews from '../../src/repositories/reviewRepo';
import { login, revokeAllTokens } from '../../src/services/authService';
import { getEnv } from '../../src/config/env';
import { buildFixture, clearDb, expectCode, PASSWORD, startDb, stopDb, type Fixture } from '../helpers';

let f: Fixture;
let app: express.Express;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  f = await buildFixture();
  // Minimal stand-in for Member 1's routes, wired the way docs/INTEGRATION.md describes.
  app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createAuthRouter());
  app.get('/api/workspaces/:workspaceId/drafts', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json({ role: getCtx(req).role, drafts: await drafts.listDrafts(getCtx(req)) });
  }));
  app.get('/api/drafts/:id', authenticate(), workspaceContext(), asyncHandler(async (req, res) => {
    res.json(await drafts.getDraft(getCtx(req), req.params.id));
  }));
  app.post('/api/drafts/:id/review', authenticate(), workspaceContext(), requirePermission('draft:decide'), asyncHandler(async (req, res) => {
    res.json(await reviews.decideDraft(getCtx(req), req.params.id, req.body));
  }));
  app.use(errorHandler());
});

const tokenFor = async (n: number) => (await login(`user${n}@brandguard.test`, PASSWORD)).token;

describe('login', () => {
  it('returns a token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'user1@brandguard.test', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it('gives the SAME response for unknown email and wrong password', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'nobody@brandguard.test', password: 'x' });
    const b = await request(app).post('/api/auth/login').send({ email: 'user1@brandguard.test', password: 'wrong' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body).toEqual(b.body);
  });
  it('a disabled account cannot log in', async () => {
    await User.updateOne({ email: 'user2@brandguard.test' }, { $set: { status: 'disabled' } });
    const res = await request(app).post('/api/auth/login').send({ email: 'user2@brandguard.test', password: PASSWORD });
    expect(res.status).toBe(401);
  });
  it('NoSQL operator injection in login is rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
  it('there is no signup route', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.test', password: 'pw' });
    expect(res.status).toBe(404);
  });
});

describe('token handling', () => {
  it('rejects missing, malformed, tampered, wrong-secret, alg=none and expired tokens', async () => {
    const good = await tokenFor(1);
    const ws = f.ids.alpha;
    const hit = (h?: string) => request(app).get(`/api/workspaces/${ws}/drafts`).set(h ? { Authorization: h } : {});
    expect((await hit()).status).toBe(401);
    expect((await hit('Bearer')).status).toBe(401);
    expect((await hit(`Token ${good}`)).status).toBe(401);
    expect((await hit(`Bearer ${good}x`)).status).toBe(401);
    const forged = jwt.sign({ tv: 0 }, 'a-completely-different-secret-value-123456', { subject: f.ids.user1, issuer: 'brandguard', audience: 'brandguard-api' });
    expect((await hit(`Bearer ${forged}`)).status).toBe(401);
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: f.ids.user1, tv: 0 })).toString('base64url')}.`;
    expect((await hit(`Bearer ${none}`)).status).toBe(401);
    const expired = jwt.sign({ tv: 0 }, getEnv().JWT_SECRET, { subject: f.ids.user1, issuer: 'brandguard', audience: 'brandguard-api', expiresIn: -10 });
    expect((await hit(`Bearer ${expired}`)).status).toBe(401);
    expect((await hit(`Bearer ${good}`)).status).toBe(200);
  });
  it('a token in the query string is ignored', async () => {
    const good = await tokenFor(1);
    const res = await request(app).get(`/api/workspaces/${f.ids.alpha}/drafts?access_token=${good}&token=${good}`);
    expect(res.status).toBe(401);
  });
  it('revokeAllTokens (tokenVersion bump) kills existing tokens; deactivation does too', async () => {
    const t = await tokenFor(2);
    expect((await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${t}`)).status).toBe(200);
    await revokeAllTokens(f.ids.user2);
    expect((await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${t}`)).status).toBe(401);
    const t3 = await tokenFor(3);
    await User.updateOne({ _id: f.ids.user3 }, { $set: { status: 'disabled' } });
    expect((await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${t3}`)).status).toBe(401);
  });
});

describe('workspace selection over HTTP', () => {
  it('lists only workspaces with membership, with the role in each', async () => {
    const t = await tokenFor(1);
    const res = await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${t}`);
    const byName = Object.fromEntries(res.body.workspaces.map((w: any) => [w.name, w.role]));
    expect(byName).toEqual({ Alpha: 'admin', Beta: 'creator' });
    const t2 = await tokenFor(2);
    const res2 = await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${t2}`);
    expect(res2.body.workspaces.map((w: any) => w.name)).toEqual(['Alpha']);
  });
  it('the same user gets a different role per workspace, resolved from the database', async () => {
    const t = await tokenFor(1);
    const a = await request(app).get(`/api/workspaces/${f.ids.alpha}/drafts`).set('Authorization', `Bearer ${t}`);
    const b = await request(app).get(`/api/workspaces/${f.ids.beta}/drafts`).set('Authorization', `Bearer ${t}`);
    expect([a.body.role, b.body.role]).toEqual(['admin', 'creator']);
  });
  it('selecting a workspace you do not belong to is 403; via X-Workspace-Id too', async () => {
    const t = await tokenFor(2); // Alpha only
    expect((await request(app).get(`/api/workspaces/${f.ids.beta}/drafts`).set('Authorization', `Bearer ${t}`)).status).toBe(403);
    const hdr = await request(app).get(`/api/drafts/${f.ids.beta}`).set('Authorization', `Bearer ${t}`).set('X-Workspace-Id', f.ids.beta);
    expect(hdr.status).toBe(403);
    expect((await request(app).get('/api/drafts/x').set('Authorization', `Bearer ${t}`).set('X-Workspace-Id', 'junk')).status).toBe(403);
  });
  it('HTTP ID substitution: an Alpha draft id requested under Beta is 404 and leaks nothing', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 'private-title', text: 'private body' });
    const t = await tokenFor(1); // admin@Alpha, creator@Beta
    const res = await request(app).get(`/api/drafts/${d._id}`).set('Authorization', `Bearer ${t}`).set('X-Workspace-Id', f.ids.beta);
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain('private');
  });
  it('role escalation: a creator calling the review route is 403, and bodies cannot smuggle a role or workspace', async () => {
    const d = await drafts.createDraft(f.alphaCreator, { title: 't', text: 'x' });
    await drafts.submitDraft(f.alphaCreator, String(d._id));
    const t = await tokenFor(2);
    const res = await request(app).post(`/api/drafts/${d._id}/review`).set('Authorization', `Bearer ${t}`).set('X-Workspace-Id', f.ids.alpha)
      .send({ decision: 'approve', role: 'reviewer', workspaceId: f.ids.alpha });
    expect(res.status).toBe(403);
    const t3 = await tokenFor(3);
    const res2 = await request(app).post(`/api/drafts/${d._id}/review`).set('Authorization', `Bearer ${t3}`).set('X-Workspace-Id', f.ids.alpha)
      .send({ decision: 'approve', workspaceId: f.ids.beta }); // unknown key => rejected by .strict()
    expect(res2.status).toBe(400);
  });
  it('error responses never include stack traces', async () => {
    const t = await tokenFor(2);
    const res = await request(app).get('/api/drafts/zzz').set('Authorization', `Bearer ${t}`).set('X-Workspace-Id', f.ids.alpha);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.ts|node_modules/);
  });
});

describe('password change', () => {
  it('requires the current password, revokes old tokens, returns a working new token', async () => {
    const old = await tokenFor(2);
    const bad = await request(app).post('/api/me/password').set('Authorization', `Bearer ${old}`).send({ currentPassword: 'nope', newPassword: 'A-brand-new-passw0rd' });
    expect(bad.status).toBe(401);
    const ok = await request(app).post('/api/me/password').set('Authorization', `Bearer ${old}`).send({ currentPassword: PASSWORD, newPassword: 'A-brand-new-passw0rd' });
    expect(ok.status).toBe(200);
    expect((await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${old}`)).status).toBe(401);
    expect((await request(app).get('/api/me/workspaces').set('Authorization', `Bearer ${ok.body.token}`)).status).toBe(200);
    await expect(login('user2@brandguard.test', PASSWORD)).rejects.toThrow();
    await login('user2@brandguard.test', 'A-brand-new-passw0rd');
  });
});

describe('login rate limiting', () => {
  it('blocks after too many attempts for the same ip+email', async () => {
    process.env.LOGIN_RATE_MAX = '3';
    const { resetEnvCache } = await import('../../src/config/env');
    resetEnvCache();
    const limited = express();
    limited.use(express.json());
    limited.use('/api', createAuthRouter());
    limited.use(errorHandler());
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await request(limited).post('/api/auth/login').send({ email: 'user1@brandguard.test', password: 'bad' })).status);
    expect(codes).toEqual([401, 401, 401, 429, 429]);
    process.env.LOGIN_RATE_MAX = '1000';
    resetEnvCache();
  });
});

void expectCode;
