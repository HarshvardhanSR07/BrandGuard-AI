import { z } from 'zod';
import {
  BrandGuardAIReviewSchema,
  BrandGuardFindingSchema,
  IssueCategoryEnum,
  SeverityEnum,
  ClaimStatusEnum,
} from '../schemas/analysis.schema';

export type IssueCategory = z.infer<typeof IssueCategoryEnum>;
export type Severity = z.infer<typeof SeverityEnum>;
export type ClaimStatus = z.infer<typeof ClaimStatusEnum>;

export type BrandGuardFinding = z.infer<typeof BrandGuardFindingSchema>;
export type BrandGuardAIReview = z.infer<typeof BrandGuardAIReviewSchema>;
