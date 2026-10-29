import request from 'supertest';
import { createApp } from '../src/app';

describe('Authentication & API Health', () => {
  const app = createApp();

  it('GET /health returns healthy service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('BrandGuard AI');
  });

  it('GET /api/health exposes LLM model and API token status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('apiKeyConfigured');
    expect(res.body).toHaveProperty('modelId');
    expect(res.body).toHaveProperty('inferenceEndpoint');
  });

  it('protected routes reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/content');
    expect([401, 403]).toContain(res.status);
  });
});
