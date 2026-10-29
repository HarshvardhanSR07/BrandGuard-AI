import request from 'supertest';
import { createApp } from '../src/app';

describe('Workspace Tenant Isolation', () => {
  const app = createApp();

  it('rejects access to content endpoints when workspace header is missing', async () => {
    // Missing Bearer token and x-workspace-id header
    const res = await request(app).get('/api/content');
    expect([401, 403]).toContain(res.status);
  });

  it('rejects access to reviews queue without authenticated workspace session', async () => {
    const res = await request(app).get('/api/reviews/queue');
    expect([401, 403]).toContain(res.status);
  });
});
