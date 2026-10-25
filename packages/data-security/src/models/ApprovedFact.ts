import { Schema, model, type Types } from 'mongoose';

export interface IApprovedFact {
  workspaceId: Types.ObjectId;
  factKey: string;
  version: number;
  statement: string;
  sourceRef: string;
  status: 'active' | 'retired';
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdBy?: Types.ObjectId | null;
}
export type ApprovedFactRec = IApprovedFact & { _id: Types.ObjectId; createdAt: Date };

const schema = new Schema<IApprovedFact>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    factKey: { type: String, required: true, immutable: true, maxlength: 80 },
    version: { type: Number, required: true, immutable: true, min: 1 },
    statement: { type: String, required: true, immutable: true, maxlength: 2000 },
    sourceRef: { type: String, required: true, immutable: true, maxlength: 500 },
    status: { type: String, enum: ['active', 'retired'], default: 'active' },
    effectiveFrom: { type: Date, required: true, default: () => new Date() },
    effectiveTo: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ workspaceId: 1, factKey: 1, version: 1 }, { unique: true });
schema.index({ workspaceId: 1, factKey: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });
schema.index({ workspaceId: 1, status: 1 });

export const ApprovedFact = model<IApprovedFact>('ApprovedFact', schema);
