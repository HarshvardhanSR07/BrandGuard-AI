import request from 'supertest';
import { createApp } from '../src/app';

describe('BrandGuard AI Analysis API', () => {
  const app = createApp();

  it('rejects /api/governance/review without brand_id or draft_text', async () => {
    const res = await request(app)
      .post('/api/governance/review')
      .send({ brand_id: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('analyses text and detects off-brand claims for VerdantCo', async () => {
    const res = await request(app)
      .post('/api/governance/review')
      .send({
        brand_id: 'VerdantCo',
        draft_text: 'Our all-natural formula offers cheap cleaning power.',
      });

    expect(res.status).toBe(200);
    expect(res.body.review).toBeDefined();
    expect(res.body.review.status).toBe('Incomplete');
    expect(res.body.review.findings.length).toBeGreaterThan(0);
    expect(res.body.path).toBe('PATH_B');
  });

  it('routes clean compliant copy to PATH_A: Auto-Approve', async () => {
    const res = await request(app)
      .post('/api/governance/review')
      .send({
        brand_id: 'VerdantCo',
        draft_text: 'VerdantCo delivers plant-derived surface care crafted with USDA Certified Biobased ingredients.',
      });

    expect(res.status).toBe(200);
    expect(res.body.review.status).toBe('Complete');
    expect(res.body.review.findings.length).toBe(0);
    expect(res.body.path).toBe('PATH_A');
  });
});
