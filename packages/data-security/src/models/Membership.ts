import { Schema, model, type Types } from 'mongoose';
import { ROLES, type Role } from '../types';

export interface IMembership {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  role: Role;
  status: 'active' | 'removed';
  addedBy?: Types.ObjectId | null;
}
export type MembershipRec = IMembership & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

/** THE authorization source of truth: role and access are always read from here, never from the JWT. */
const schema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, immutable: true },
    role: { type: String, enum: ROLES, required: true },
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);
schema.index({ userId: 1, workspaceId: 1 }, { unique: true });
schema.index({ workspaceId: 1, role: 1, status: 1 });

export const Membership = model<IMembership>('Membership', schema);
