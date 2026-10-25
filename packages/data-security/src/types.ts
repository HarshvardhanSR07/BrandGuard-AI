/** Shared domain constants and types. Import these from the frontend/backend too, so everyone agrees on the values. */

export const ROLES = ['admin', 'creator', 'reviewer'] as const;
export type Role = (typeof ROLES)[number];

export const DRAFT_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'changes_requested'] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const CHANNELS = ['social', 'web', 'email', 'ad', 'print', 'other'] as const;
export type Channel = (typeof CHANNELS)[number];

export const DRAFT_DECISIONS = ['approve', 'reject', 'request_changes'] as const;
export type DraftDecision = (typeof DRAFT_DECISIONS)[number];

export const FINDING_DECISIONS = ['accept', 'dismiss'] as const;
export type FindingDecision = (typeof FINDING_DECISIONS)[number];

export const FINDING_DISPOSITIONS = ['open', 'accepted', 'dismissed'] as const;
export type FindingDisposition = (typeof FINDING_DISPOSITIONS)[number];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const POLICY_CATEGORIES = [
  'prohibited_phrase', 'required_phrase', 'terminology', 'disclaimer', 'tone', 'claim', 'accessibility', 'other',
] as const;
export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

/** Claim/evidence status taxonomy from the proposal (section 8). */
export const EVIDENCE_STATUSES = [
  'supported', 'contradicted', 'unverified', 'stale', 'conflicting', 'not_applicable',
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const ANALYSIS_STATUSES = ['pending', 'complete', 'incomplete', 'failed'] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const AI_STATUSES = ['not_run', 'complete', 'unavailable', 'timeout', 'failed'] as const;
export type AiStatus = (typeof AI_STATUSES)[number];

export const OCR_STATUSES = ['not_applicable', 'complete', 'incomplete', 'failed'] as const;
export type OcrStatus = (typeof OCR_STATUSES)[number];

export const EXTRACTION_STATUSES = ['pending', 'complete', 'incomplete', 'failed'] as const;
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

export const EVIDENCE_KINDS = ['policy', 'fact'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const ALLOWED_UPLOAD_MIME = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg'] as const;

export const AUDIT_ACTIONS = [
  'draft.created', 'draft.revised', 'draft.submitted', 'draft.approved', 'draft.rejected', 'draft.changes_requested',
  'analysis.started', 'analysis.finished', 'finding.accepted', 'finding.dismissed',
  'policy.created', 'policy.retired', 'fact.created', 'fact.retired',
  'membership.added', 'membership.role_changed', 'membership.removed',
  'upload.created',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
