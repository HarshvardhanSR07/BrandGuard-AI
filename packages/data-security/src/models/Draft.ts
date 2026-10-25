import { Schema, model, type Types } from 'mongoose';
import { CHANNELS, DRAFT_STATUSES, type Channel, type DraftStatus } from '../types';

export interface IDraft {
  workspaceId: Types.ObjectId;
  authorId: Types.ObjectId;
  title: string;
  channel: Channel;
  status: DraftStatus;
  currentRevisionId: Types.ObjectId;
  currentRevisionNo: number;
  submittedAt?: Date | null;
  decidedAt?: Date | null;
}
export type DraftRec = IDraft & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const schema = new Schema<IDraft>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    channel: { type: String, enum: CHANNELS, default: 'other' },
    status: { type: String, enum: DRAFT_STATUSES, default: 'draft' },
    currentRevisionId: { type: Schema.Types.ObjectId, ref: 'Revision', required: true },
    currentRevisionNo: { type: Number, required: true, min: 1 },
    submittedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ workspaceId: 1, status: 1, createdAt: -1 });
schema.index({ workspaceId: 1, authorId: 1, createdAt: -1 });

export const Draft = model<IDraft>('Draft', schema);
