import { Schema, model, type Types } from 'mongoose';
import {
  EVIDENCE_KINDS, EVIDENCE_STATUSES, FINDING_DISPOSITIONS, SEVERITIES,
  type EvidenceKind, type EvidenceStatus, type FindingDisposition, type Severity,
} from '../types';

export interface EvidenceRef {
  kind: EvidenceKind;
  refId: Types.ObjectId;
  key: string;
  version: number;
}
export interface IFinding {
  workspaceId: Types.ObjectId;
  draftId: Types.ObjectId;
  revisionId: Types.ObjectId;
  analysisId: Types.ObjectId;
  category: string;
  severity: Severity;
  source: 'deterministic' | 'ai';
  ruleKey?: string;
  excerpt: string;
  startOffset?: number;
  endOffset?: number;
  explanation: string;
  evidenceRefs: EvidenceRef[];
  evidenceStatus: EvidenceStatus;
  uncertainty?: string;
  suggestion?: { text: string; revalidated: boolean; revalidationPassed: boolean; ready: boolean };
  disposition: FindingDisposition;
  decidedBy?: Types.ObjectId | null;
  decidedAt?: Date | null;
}
export type FindingRec = IFinding & { _id: Types.ObjectId; createdAt: Date };

const ref = new Schema<EvidenceRef>(
  {
    kind: { type: String, enum: EVIDENCE_KINDS, required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    key: { type: String, required: true },
    version: { type: Number, required: true },
  },
  { _id: false },
);

const schema = new Schema<IFinding>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'Draft', required: true, immutable: true },
    revisionId: { type: Schema.Types.ObjectId, ref: 'Revision', required: true, immutable: true },
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true, immutable: true },
    category: { type: String, required: true, maxlength: 60 },
    severity: { type: String, enum: SEVERITIES, required: true },
    source: { type: String, enum: ['deterministic', 'ai'], required: true },
    ruleKey: { type: String, maxlength: 80 },
    excerpt: { type: String, default: '', maxlength: 500 },
    startOffset: Number,
    endOffset: Number,
    explanation: { type: String, required: true, maxlength: 2000 },
    evidenceRefs: { type: [ref], default: [] },
    evidenceStatus: { type: String, enum: EVIDENCE_STATUSES, required: true },
    uncertainty: { type: String, maxlength: 500 },
    suggestion: {
      type: new Schema(
        {
          text: { type: String, required: true, maxlength: 2000 },
          revalidated: { type: Boolean, required: true },
          revalidationPassed: { type: Boolean, required: true },
          ready: { type: Boolean, required: true },
        },
        { _id: false },
      ),
      required: false,
    },
    disposition: { type: String, enum: FINDING_DISPOSITIONS, default: 'open' },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ workspaceId: 1, draftId: 1, revisionId: 1 });
schema.index({ workspaceId: 1, category: 1, ruleKey: 1 });
schema.index({ workspaceId: 1, severity: 1, disposition: 1 });

export const Finding = model<IFinding>('Finding', schema);
