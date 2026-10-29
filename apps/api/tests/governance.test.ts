import { brandGuardAIService } from '../src/ai/brandGuardAIService';

describe('BrandGuard AI Governance Engine & Logical Gates', () => {
  it('evaluates Gate L-01: Auto-approves compliant copy (PATH_A)', async () => {
    const result = await brandGuardAIService.brand_governance_review(
      'VerdantCo',
      'VerdantCo surface cleaners use certified plant-derived surfactants for homes.'
    );

    expect(result.path).toBe('PATH_A');
    expect(result.action).toContain('Brand Approved');
    expect(result.review.findings).toHaveLength(0);
  });

  it('evaluates Gate L-02: Routes terminology findings to Moderator (PATH_B)', async () => {
    const result = await brandGuardAIService.brand_governance_review(
      'VerdantCo',
      'Get all-natural cleaning products for every room.'
    );

    expect(result.path).toBe('PATH_B');
    expect(result.action).toContain('Human Moderator');
    expect(result.review.findings.some(f => f.issue_category === 'Terminology')).toBe(true);
  });

  it('evaluates Gate L-03 & L-05: Handles health assertions and provides evidence references', async () => {
    const result = await brandGuardAIService.brand_governance_review(
      'VerdantCo',
      'Our botanical blend will cure and prevent seasonal flu infections naturally.'
    );

    expect(result.path).toBe('PATH_B');
    expect(result.review.human_review_required).toBe(true);
    expect(result.review.findings.some(f => f.severity === 'Critical' || f.severity === 'High')).toBe(true);
  });
});
