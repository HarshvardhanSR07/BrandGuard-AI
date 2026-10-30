import { Schema, model, type Types } from 'mongoose';
import { ROLES, type Role } from '../types';

export interface IInvitation {
  workspaceId: Types.ObjectId;
  email: string;
  role: Role;
  invitedBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'revoked';
  token: string;
  expiresAt: Date;
}

export type InvitationRec = IInvitation & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const schema = new Schema<IInvitation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ROLES, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending', index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

schema.index({ workspaceId: 1, email: 1, status: 1 });

export const Invitation = model<IInvitation>('Invitation', schema);
