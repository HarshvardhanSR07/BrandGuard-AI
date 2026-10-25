/**
 * Zod schemas for every request body this package accepts. All objects are .strict(): unknown keys
 * (e.g. a client sending workspaceId, role, authorId, status) are REJECTED, which blocks mass-assignment.
 * z.string() also rejects objects, so {"$ne": null} can never reach a query as a string field.
 * Repositories re-parse their input with these schemas (defence in depth), so a route that forgets to validate is still safe.
 */
import { z } from 'zod';
import {
  AI_STATUSES, ALLOWED_UPLOAD_MIME, CHANNELS, DRAFT_DECISIONS, EVIDENCE_KINDS, EVIDENCE_STATUSES,
  EXTRACTION_STATUSES, FINDING_DECISIONS, OCR_STATUSES, POLICY_CATEGORIES, ROLES, SEVERITIES,
} from '../types';
import { OBJECT_ID_RE } from './ids';

export const objectIdSchema = z.string().regex(OBJECT_ID_RE, 'invalid id');
const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) => z.string().trim().max(max).optional();

export const MAX_REVISION_CHARS = 50_000;

export const loginBody = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(200),
  })
  .strict();

export const changePasswordBody = z
  .object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(12, 'at least 12 characters').max(200) })
  .strict()
  .refine((b) => b.currentPassword !== b.newPassword, { message: 'new password must differ', path: ['newPassword'] });

export const createDraftBody = z
  .object({ title: text(200), channel: z.enum(CHANNELS).default('other'), text: z.string().min(1).max(MAX_REVISION_CHARS) })
  .strict();

export const reviseDraftBody = z
  .object({
    text: z.string().min(1).max(MAX_REVISION_CHARS),
    source: z.enum(['manual', 'suggestion', 'upload']).default('manual'),
    uploadId: objectIdSchema.optional(),
  })
  .strict();

export const draftDecisionBody = z
  .object({ decision: z.enum(DRAFT_DECISIONS), rationale: optText(2000) })
  .strict()
  .refine((b) => b.decision === 'approve' || (b.rationale && b.rationale.length > 0), {
    message: 'rationale is required when rejecting or requesting changes',
    path: ['rationale'],
  });

export const findingDecisionBody = z
  .object({ decision: z.enum(FINDING_DECISIONS), rationale: optText(2000) })
  .strict();

export const listDraftsQuery = z
  .object({
    status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'changes_requested']).optional(),
    mine: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    skip: z.coerce.number().int().min(0).max(10_000).default(0),
  })
  .strict();

const phrases = z.array(text(100)).max(20);

export const policyBody = z
  .object({
    ruleKey: z.string().trim().min(1).max(80).regex(/^[a-z0-9_.-]+$/i, 'letters, digits, _ . - only'),
    category: z.enum(POLICY_CATEGORIES),
    text: text(2000),
    severity: z.enum(SEVERITIES),
    phrases: phrases.default([]), // literal, case-insensitive phrases for the deterministic engine (no regex: ReDoS risk)
    suggestedReplacement: optText(500),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().nullable().optional(),
  })
  .strict();

export const factBody = z
  .object({
    factKey: z.string().trim().min(1).max(80).regex(/^[a-z0-9_.-]+$/i, 'letters, digits, _ . - only'),
    statement: text(2000),
    sourceRef: text(500),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().nullable().optional(),
  })
  .strict();

export const addMemberBody = z
  .object({ email: z.string().trim().toLowerCase().email().max(254), role: z.enum(ROLES) })
  .strict();
export const changeRoleBody = z.object({ role: z.enum(ROLES) }).strict();

export const uploadBody = z
  .object({
    originalName: text(255),
    mime: z.enum(ALLOWED_UPLOAD_MIME),
    size: z.number().int().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    draftId: objectIdSchema.optional(),
    extractionStatus: z.enum(EXTRACTION_STATUSES),
    ocrStatus: z.enum(OCR_STATUSES).default('not_applicable'),
    extractedText: z.string().max(2_000_000).default(''), // hard cap enforced again (bytes) in the repository
    errors: z.array(text(300)).max(20).default([]),
  })
  .strict();

const evidenceRef = z.object({ kind: z.enum(EVIDENCE_KINDS), refId: objectIdSchema }).strict();

export const findingInput = z
  .object({
    category: text(60),
    severity: z.enum(SEVERITIES),
    source: z.enum(['deterministic', 'ai']),
    ruleKey: optText(80),
    excerpt: z.string().max(500).default(''),
    startOffset: z.number().int().min(0).optional(),
    endOffset: z.number().int().min(0).optional(),
    explanation: text(2000),
    evidenceRefs: z.array(evidenceRef).max(10).default([]),
    evidenceStatus: z.enum(EVIDENCE_STATUSES),
    uncertainty: optText(500),
    suggestion: z
      .object({ text: text(2000), revalidated: z.boolean(), revalidationPassed: z.boolean() })
      .strict()
      .optional(),
  })
  .strict();
export const recordFindingsBody = z.object({ findings: z.array(findingInput).max(200) }).strict();

export const finalizeAnalysisBody = z
  .object({
    deterministicStatus: z.enum(['complete', 'failed']),
    aiRequired: z.boolean(),
    aiStatus: z.enum(AI_STATUSES),
    ocrStatus: z.enum(OCR_STATUSES).default('not_applicable'),
    errors: z.array(text(300)).max(20).default([]),
  })
  .strict();

export const auditListQuery = z
  .object({ limit: z.coerce.number().int().min(1).max(200).default(50), beforeSeq: z.coerce.number().int().positive().optional() })
  .strict();

export type CreateDraftInput = z.input<typeof createDraftBody>;
export type ReviseDraftInput = z.input<typeof reviseDraftBody>;
export type DraftDecisionInput = z.input<typeof draftDecisionBody>;
export type FindingDecisionInput = z.input<typeof findingDecisionBody>;
export type PolicyInput = z.input<typeof policyBody>;
export type FactInput = z.input<typeof factBody>;
export type UploadInput = z.input<typeof uploadBody>;
export type FindingInput = z.input<typeof findingInput>;
export type FinalizeAnalysisInput = z.input<typeof finalizeAnalysisBody>;
