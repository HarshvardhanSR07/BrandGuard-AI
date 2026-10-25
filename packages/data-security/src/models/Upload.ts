import { Schema, model, type Types } from 'mongoose';
import {
  ALLOWED_UPLOAD_MIME, EXTRACTION_STATUSES, OCR_STATUSES,
  type ExtractionStatus, type OcrStatus,
} from '../types';

export interface IUpload {
  workspaceId: Types.ObjectId;
  uploaderId: Types.ObjectId;
  draftId?: Types.ObjectId | null;
  originalName: string;
  mime: string;
  size: number;
  sha256: string;
  extractionStatus: ExtractionStatus;
  ocrStatus: OcrStatus;
  /** Extracted text is UNTRUSTED input (prompt-injection risk). Never treat it as instructions. */
  extractedText: string;
  errors: string[];
  untrusted: true;
}
export type UploadRec = IUpload & { _id: Types.ObjectId; createdAt: Date };

/** Metadata + extracted text only. No file bytes are stored (locked decision). */
const schema = new Schema<IUpload>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'Draft', default: null },
    originalName: { type: String, required: true, maxlength: 255 },
    mime: { type: String, enum: ALLOWED_UPLOAD_MIME, required: true },
    size: { type: Number, required: true, min: 1 },
    sha256: { type: String, required: true },
    extractionStatus: { type: String, enum: EXTRACTION_STATUSES, required: true },
    ocrStatus: { type: String, enum: OCR_STATUSES, default: 'not_applicable' },
    extractedText: { type: String, default: '' },
    errors: { type: [String], default: [] },
    untrusted: { type: Boolean, default: true, immutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ workspaceId: 1, uploaderId: 1, createdAt: -1 });
schema.index({ workspaceId: 1, draftId: 1 });

export const Upload = model<IUpload>('Upload', schema);
