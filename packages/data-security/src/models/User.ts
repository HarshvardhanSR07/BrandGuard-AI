import { Schema, model, type Types } from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  displayName: string;
  status: 'active' | 'disabled';
  /** Bump to invalidate every token issued before (password change, deactivation). */
  tokenVersion: number;
}
export type UserRec = IUser & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const schema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false }, // never returned unless explicitly selected
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', schema);
