import { z } from 'zod';

export const IssueCategoryEnum = z.enum([
  'Tone',
  'Terminology',
  'Factual Claim',
  'Stale Information',
  'Prompt Injection',
  'Conflicting Evidence',
]);

export const SeverityEnum = z.enum(['Low', 'Medium', 'High', 'Critical']);

export const ClaimStatusEnum = z.enum([
  'Supported',
  'Unverified',
  'Stale',
  'Conflicting',
  'Not applicable',
]);

export const BrandGuardFindingSchema = z.object({
  finding_id: z.number().int().min(1),
  issue_category: IssueCategoryEnum,
  severity: SeverityEnum,
  affected_text: z.string(),
  rule_reference: z.string().nullable().optional(),
  evidence_references: z.array(z.string()),
  claim_status: ClaimStatusEnum,
  explanation: z.string(),
  corrected_text: z.string().nullable().optional(),
  human_review_required: z.boolean().optional(),
}).strict();

export const BrandGuardAIReviewSchema = z.object({
  review_id: z.string().uuid(),
  brand_id: z.string(),
  status: z.enum(['Complete', 'Incomplete']),
  human_review_required: z.boolean(),
  incomplete_reasons: z.array(z.string()),
  findings: z.array(BrandGuardFindingSchema),
  model_version: z.string(),
  rulebook_version: z.string(),
  timestamp: z.string().datetime(),
}).strict();
