import { Schema, model, type Types } from 'mongoose';
import {
  AI_STATUSES, ANALYSIS_STATUSES, EVIDENCE_KINDS, OCR_STATUSES,
  type AiStatus, type AnalysisStatus, type EvidenceKind, type OcrStatus,
} from '../types';

export interface PinnedSource {
  kind: EvidenceKind;
  refId: Types.ObjectId;
  key: string;
  version: number;
}
export interface IAnalysis {
  workspaceId: Types.ObjectId;
  draftId: Types.ObjectId;
  revisionId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  status: AnalysisStatus;
  aiStatus: AiStatus;
  ocrStatus: OcrStatus;
  /** The exact policy/fact versions in force when the analysis started. Findings may cite ONLY these. */
  pinnedSources: PinnedSource[];
  errors: string[];
  startedAt: Date;
  finishedAt?: Date | null;
}
export type AnalysisRec = IAnalysis & { _id: Types.ObjectId; createdAt: Date };

const pinned = new Schema<PinnedSource>(
  {
    kind: { type: String, enum: EVIDENCE_KINDS, required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    key: { type: String, required: true },
    version: { type: Number, required: true },
  },
  { _id: false },
);

const schema = new Schema<IAnalysis>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'Draft', required: true, immutable: true },
    revisionId: { type: Schema.Types.ObjectId, ref: 'Revision', required: true, immutable: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    status: { type: String, enum: ANALYSIS_STATUSES, default: 'pending' },
    aiStatus: { type: String, enum: AI_STATUSES, default: 'not_run' },
    ocrStatus: { type: String, enum: OCR_STATUSES, default: 'not_applicable' },
    pinnedSources: { type: [pinned], default: [], immutable: true },
    errors: { type: [String], default: [] },
    startedAt: { type: Date, default: () => new Date() },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ workspaceId: 1, draftId: 1, createdAt: -1 });

export const Analysis = model<IAnalysis>('Analysis', schema);
