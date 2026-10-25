import { Schema, model, type Types } from 'mongoose';
import { POLICY_CATEGORIES, SEVERITIES, type PolicyCategory, type Severity } from '../types';

export interface IPolicy {
  workspaceId: Types.ObjectId;
  ruleKey: string;
  version: number;
  category: PolicyCategory;
  text: string;
  severity: Severity;
  phrases: string[];
  suggestedReplacement?: string;
  status: 'active' | 'retired';
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdBy?: Types.ObjectId | null;
}
export type PolicyRec = IPolicy & { _id: Types.ObjectId; createdAt: Date };

/** Versioned: content is never edited; a change creates version n+1 and retires version n. */
const schema = new Schema<IPolicy>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    ruleKey: { type: String, required: true, immutable: true, maxlength: 80 },
    version: { type: Number, required: true, immutable: true, min: 1 },
    category: { type: String, enum: POLICY_CATEGORIES, required: true, immutable: true },
    text: { type: String, required: true, immutable: true, maxlength: 2000 },
    severity: { type: String, enum: SEVERITIES, required: true, immutable: true },
    phrases: { type: [String], default: [], immutable: true },
    suggestedReplacement: { type: String, maxlength: 500, immutable: true },
    status: { type: String, enum: ['active', 'retired'], default: 'active' },
    effectiveFrom: { type: Date, required: true, default: () => new Date() },
    effectiveTo: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ workspaceId: 1, ruleKey: 1, version: 1 }, { unique: true });
// At most one ACTIVE version per rule.
schema.index({ workspaceId: 1, ruleKey: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });
schema.index({ workspaceId: 1, status: 1, category: 1 });

export const Policy = model<IPolicy>('Policy', schema);
