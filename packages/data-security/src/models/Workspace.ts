import { Schema, model, type Types } from 'mongoose';

export interface IWorkspace {
  name: string;
  brandName: string;
  status: 'active' | 'archived';
  isSynthetic: boolean;
}
export type WorkspaceRec = IWorkspace & { _id: Types.ObjectId; createdAt: Date };

const schema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brandName: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    isSynthetic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Workspace = model<IWorkspace>('Workspace', schema);
