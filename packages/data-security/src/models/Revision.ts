import { Schema, model, type Types } from 'mongoose';
import { makeAppendOnly } from './appendOnly';

export interface IRevision {
  workspaceId: Types.ObjectId;
  draftId: Types.ObjectId;
  n: number;
  text: string;
  contentHash: string;
  authorId: Types.ObjectId;
  source: 'manual' | 'suggestion' | 'upload';
  uploadId?: Types.ObjectId | null;
}
export type RevisionRec = IRevision & { _id: Types.ObjectId; createdAt: Date };

/** Immutable: every edit is a new revision. */
const schema = new Schema<IRevision>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'Draft', required: true },
    n: { type: Number, required: true, min: 1 },
    text: { type: String, required: true, maxlength: 50_000 },
    contentHash: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['manual', 'suggestion', 'upload'], default: 'manual' },
    uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ draftId: 1, n: 1 }, { unique: true });
schema.index({ workspaceId: 1, draftId: 1 });
makeAppendOnly(schema, 'Revision');

export const Revision = model<IRevision>('Revision', schema);
