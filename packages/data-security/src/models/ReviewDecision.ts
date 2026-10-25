import { Schema, model, type Types } from 'mongoose';
import { makeAppendOnly } from './appendOnly';

export interface IReviewDecision {
  workspaceId: Types.ObjectId;
  draftId: Types.ObjectId;
  targetType: 'draft' | 'finding';
  targetId: Types.ObjectId;
  actorId: Types.ObjectId;
  decision: string; // approve | reject | request_changes | accept | dismiss
  rationale?: string;
  at: Date;
}
export type ReviewDecisionRec = IReviewDecision & { _id: Types.ObjectId };

const schema = new Schema<IReviewDecision>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'Draft', required: true },
    targetType: { type: String, enum: ['draft', 'finding'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    decision: { type: String, required: true },
    rationale: { type: String, maxlength: 2000 },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);
schema.index({ workspaceId: 1, draftId: 1, at: -1 });
makeAppendOnly(schema, 'ReviewDecision');

export const ReviewDecision = model<IReviewDecision>('ReviewDecision', schema);
