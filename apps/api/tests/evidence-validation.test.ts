import { brandGuardAIService } from '../src/ai/brandGuardAIService';

describe('Evidence Validation and Grounding', () => {
  it('cites specific rulebook sections for VerdantCo violations', async () => {
    const result = await brandGuardAIService.brand_governance_review(
      'VerdantCo',
      'VerdantCo is an all-natural and 100% chemical-free floor cleaner.'
    );

    expect(result.review.findings.length).toBeGreaterThanOrEqual(1);
    const ruleRefs = result.review.findings.map(f => f.rule_reference);
    expect(ruleRefs.some(r => Boolean(r && r.startsWith('Verdant')))).toBe(true);

    const finding = result.review.findings.find(f => f.affected_text.includes('all-natural') || f.affected_text.includes('chemical-free'));
    expect(finding).toBeDefined();
    expect(finding?.evidence_references.length).toBeGreaterThan(0);
    expect(finding?.corrected_text).toBeDefined();
  });

  it('provides actionable suggestions for off-brand claims', async () => {
    const result = await brandGuardAIService.brand_governance_review(
      'VerdantCo',
      'The cheap alternative to standard soaps.'
    );

    const finding = result.review.findings.find(f => f.affected_text === 'cheap');
    expect(finding).toBeDefined();
    expect(['accessible', 'affordable', 'cost-effective']).toContain(finding?.corrected_text);
  });
});
