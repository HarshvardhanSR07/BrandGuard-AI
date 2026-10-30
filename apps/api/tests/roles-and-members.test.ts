import request from 'supertest';
import { createApp } from '../src/app';
import * as dataSecurity from '@brandguard/data-security';

describe('Role-Based Access Control & Member Management', () => {
  const app = createApp();
  let adminToken: string;
  let reviewerToken: string;
  let creatorToken: string;
  let workspaceId: string;
  let creatorUserId: string;

  beforeAll(async () => {
    await dataSecurity.connectDb();

    // 1. Authenticate Creator
    const creatorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'creator@brandguard.demo', password: 'BrandGuard2026!' });
    expect(creatorRes.status).toBe(200);
    creatorToken = creatorRes.body.token;
    creatorUserId = creatorRes.body.user.id;
    workspaceId = creatorRes.body.user.workspaces[0].workspaceId;

    // 2. Authenticate Reviewer
    const reviewerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reviewer@brandguard.demo', password: 'BrandGuard2026!' });
    expect(reviewerRes.status).toBe(200);
    reviewerToken = reviewerRes.body.token;

    // 3. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@brandguard.demo', password: 'BrandGuard2026!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await dataSecurity.disconnectDb();
  });

  describe('Creator Permissions', () => {
    it('Creator can create and view content drafts', async () => {
      const res = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${creatorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({
          title: 'Test Draft by Creator',
          channel: 'social',
          text: 'Acme Cloud Platform is awesome.',
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Draft by Creator');
    });

    it('Creator is forbidden from accessing the Review Queue', async () => {
      const res = await request(app)
        .get('/api/reviews/queue')
        .set('Authorization', `Bearer ${creatorToken}`)
        .set('x-workspace-id', workspaceId);
      expect(res.status).toBe(403);
    });

    it('Creator is forbidden from managing workspace members', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${creatorToken}`)
        .set('x-workspace-id', workspaceId);
      expect(res.status).toBe(403);
    });

    it('Creator is forbidden from modifying brand policies', async () => {
      const res = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${creatorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({
          ruleKey: 'forbidden-creator-rule',
          category: 'prohibited_phrase',
          severity: 'low',
          text: 'Creators cannot make rules.',
          phrases: ['creator test'],
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Reviewer Permissions', () => {
    it('Reviewer can access the review queue', async () => {
      const res = await request(app)
        .get('/api/reviews/queue')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .set('x-workspace-id', workspaceId);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('Reviewer is forbidden from managing workspace members', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .set('x-workspace-id', workspaceId);
      expect(res.status).toBe(403);
    });

    it('Reviewer is forbidden from managing brand policies', async () => {
      const res = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .set('x-workspace-id', workspaceId)
        .send({
          ruleKey: 'forbidden-reviewer-rule',
          category: 'prohibited_phrase',
          severity: 'low',
          text: 'Reviewers cannot make rules.',
          phrases: ['reviewer test'],
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Admin Permissions', () => {
    it('Admin can list workspace members and pending invitations', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId);
      expect(res.status).toBe(200);
      expect(res.body.members).toBeDefined();
      expect(Array.isArray(res.body.members)).toBe(true);
      expect(res.body.members.length).toBeGreaterThanOrEqual(3);
    });

    it('Admin can invite a new member by email', async () => {
      const inviteEmail = `invited-${Date.now()}@acme.brand`;
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({
          email: inviteEmail,
          role: 'reviewer',
        });
      expect(res.status).toBe(201);
      expect(res.body.email).toBe(inviteEmail);
      expect(res.body.role).toBe('reviewer');
      expect(res.body.status).toBe('pending');
    });

    it('Admin can change role of an existing member', async () => {
      // Temporarily change creator to reviewer
      const patchRes = await request(app)
        .patch(`/api/members/${creatorUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ role: 'reviewer' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.role).toBe('reviewer');

      // Revert back to creator
      const revertRes = await request(app)
        .patch(`/api/members/${creatorUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ role: 'creator' });
      expect(revertRes.status).toBe(200);
      expect(revertRes.body.role).toBe('creator');
    });

    it('Admin can create a brand policy', async () => {
      const uniqueKey = `rule-admin-${Date.now()}`;
      const res = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({
          ruleKey: uniqueKey,
          category: 'prohibited_phrase',
          severity: 'medium',
          text: 'Admin created rule for testing.',
          phrases: ['admin test rule'],
          suggestedReplacement: 'admin replacement',
        });
      expect(res.status).toBe(201);
      expect(res.body.ruleKey).toBe(uniqueKey);
    });
  });
});
