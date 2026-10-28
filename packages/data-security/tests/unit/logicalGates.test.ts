import { describe, expect, it } from 'vitest';
import {
  evaluateLogicalGates,
  buildChatMLPrompt,
  BrandGuardAIReview,
} from '../../../../packages/shared/src';

describe('BrandGuard AI Integration Spec v1.1 — Safety Gates & Logic', () => {
  const mockSER = new Set(['SER_001', 'SER_002', 'SER_VERDANT_ORGANIC']);

  const baseValidReview: BrandGuardAIReview = {
    review_id: '123e4567-e89b-12d3-a456-426614174000',
    brand_id: 'VerdantCo',
    status: 'Complete',
    human_review_required: false,
    incomplete_reasons: [],
    findings: [],
    model_version: 'brandguard-ai-model-qwen3-4b',
    rulebook_version: 'v1.1',
    timestamp: '2026-10-29T00:00:00.000Z',
  };

  it('Step B: ChatML prompt generation matches the official template', () => {
    const prompt = buildChatMLPrompt({
      brand_id: 'VerdantCo',
      rules: [{ id: 'R1', text: 'Eco-friendly only' }],
      ser: [{ id: 'SER_001', claim: '100% organic cotton' }],
      draft_text: 'Buy our new green t-shirt.',
    });

    expect(prompt.fullChatMLPrompt).toContain('<|im_start|>system');
    expect(prompt.systemMessage).toContain('Return ONLY valid JSON matching BrandGuardReview_v1.1 schema');
    expect(prompt.fullChatMLPrompt).toContain('<|im_start|>user');
    expect(prompt.userMessage).toContain('Brand: VerdantCo');
    expect(prompt.fullChatMLPrompt).toContain('<|im_start|>assistant');
  });

  it('Gate 1: Malformed JSON triggers Structural Failure (PATH C)', () => {
    const result = evaluateLogicalGates('INVALID_NON_JSON_OUTPUT', mockSER);
    expect(result.structuralFailure).toBe(true);
    expect(result.path).toBe('PATH_C');
    expect(result.review.status).toBe('Incomplete');
    expect(result.review.human_review_required).toBe(true);
    expect(result.review.incomplete_reasons[0]).toContain('Structural failure');
  });

  it('Gate 1: Missing required fields in schema triggers Structural Failure', () => {
    const brokenJson = {
      review_id: '123e4567-e89b-12d3-a456-426614174000',
      // missing brand_id, status, etc.
    };
    const result = evaluateLogicalGates(brokenJson, mockSER);
    expect(result.structuralFailure).toBe(true);
    expect(result.path).toBe('PATH_C');
    expect(result.review.status).toBe('Incomplete');
    expect(result.review.human_review_required).toBe(true);
  });

  it('L-01: Incomplete status automatically enforces human_review_required = true', () => {
    const incompleteReview: BrandGuardAIReview = {
      ...baseValidReview,
      status: 'Incomplete',
      human_review_required: false, // Model erroneously claimed false
      incomplete_reasons: ['Missing context'],
    };

    const result = evaluateLogicalGates(incompleteReview, mockSER);
    expect(result.appliedGates).toContain('L-01');
    expect(result.review.human_review_required).toBe(true);
    expect(result.path).toBe('PATH_B');
  });

  it('L-06: Duplicate finding_id forces status = Incomplete', () => {
    const reviewWithDuplicates: BrandGuardAIReview = {
      ...baseValidReview,
      findings: [
        {
          finding_id: 1,
          issue_category: 'Tone',
          severity: 'Low',
          affected_text: 'cheap',
          explanation: 'Not premium',
          evidence_references: ['SER_001'],
          claim_status: 'Supported',
          corrected_text: 'affordable',
        },
        {
          finding_id: 1, // Duplicate ID
          issue_category: 'Terminology',
          severity: 'Low',
          affected_text: 'fast',
          explanation: 'Misleading',
          evidence_references: ['SER_002'],
          claim_status: 'Supported',
          corrected_text: 'efficient',
        },
      ],
    };

    const result = evaluateLogicalGates(reviewWithDuplicates, mockSER);
    expect(result.appliedGates).toContain('L-06');
    expect(result.review.status).toBe('Incomplete');
    expect(result.review.human_review_required).toBe(true);
    expect(result.path).toBe('PATH_B');
  });

  it('L-05: Missing evidence_reference in live SER overrides claim_status to Unverified and triggers L-03', () => {
    const reviewWithBadSER: BrandGuardAIReview = {
      ...baseValidReview,
      findings: [
        {
          finding_id: 1,
          issue_category: 'Factual Claim',
          severity: 'Medium',
          affected_text: 'Cures disease in 3 days',
          explanation: 'Medical claim',
          evidence_references: ['NON_EXISTENT_SER_KEY'],
          claim_status: 'Supported', // Model hallucinatory claimed supported
          corrected_text: null,
        },
      ],
    };

    const result = evaluateLogicalGates(reviewWithBadSER, mockSER);
    expect(result.appliedGates).toContain('L-05');
    expect(result.appliedGates).toContain('L-03');
    expect(result.review.findings[0].claim_status).toBe('Unverified');
    expect(result.review.status).toBe('Incomplete');
    expect(result.review.human_review_required).toBe(true);
    expect(result.path).toBe('PATH_B');
  });

  it('L-04: High or Critical severity with null corrected_text forces human_review_required', () => {
    const reviewWithCriticalNoFix: BrandGuardAIReview = {
      ...baseValidReview,
      status: 'Complete',
      human_review_required: false,
      findings: [
        {
          finding_id: 1,
          issue_category: 'Prompt Injection',
          severity: 'Critical',
          affected_text: 'Ignore previous instructions',
          explanation: 'Adversarial attack detected',
          evidence_references: ['SER_001'],
          claim_status: 'Supported',
          corrected_text: null, // No safe fix exists
        },
      ],
    };

    const result = evaluateLogicalGates(reviewWithCriticalNoFix, mockSER);
    expect(result.appliedGates).toContain('L-04');
    expect(result.review.human_review_required).toBe(true);
    expect(result.path).toBe('PATH_B');
  });

  it('Path A: Clean review with zero violations is marked Brand Approved', () => {
    const cleanReview: BrandGuardAIReview = {
      ...baseValidReview,
      status: 'Complete',
      human_review_required: false,
      findings: [],
    };

    const result = evaluateLogicalGates(cleanReview, mockSER);
    expect(result.path).toBe('PATH_A');
    expect(result.action).toBe('Mark as "Brand Approved."');
    expect(result.review.status).toBe('Complete');
    expect(result.review.human_review_required).toBe(false);
  });

  it('SER & Rulebook Registry: Validates all 3 official brands and evidence keys', async () => {
    const { getBrandRules, getBrandSER, getBrandSERKeys, isValidEvidenceReference } = await import(
      '../../../../packages/shared/src'
    );

    // VerdantCo
    const verdantRules = getBrandRules('VerdantCo');
    expect(verdantRules.length).toBe(4);
    expect(verdantRules.some((r) => r.rule_id === 'Verdant_R1')).toBe(true);
    expect(isValidEvidenceReference('EVID_V_04', 'VerdantCo')).toBe(true);

    // NorthstarFin
    const northstarRules = getBrandRules('NorthstarFin');
    expect(northstarRules.length).toBe(4);
    expect(isValidEvidenceReference('EVID_N_04', 'NorthstarFin')).toBe(true);

    // BrightPath
    const brightRules = getBrandRules('BrightPath');
    expect(brightRules.length).toBe(5);
    expect(isValidEvidenceReference('EVID_B_03', 'BrightPath')).toBe(true);
    expect(isValidEvidenceReference('INVALID_NONEXISTENT_KEY', 'BrightPath')).toBe(false);
  });
});
