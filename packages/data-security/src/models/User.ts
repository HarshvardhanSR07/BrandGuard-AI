import { Schema, model, type Types } from 'mongoose';

export interface IAuthProvider {
  provider: 'local' | 'google' | 'microsoft';
  providerId: string;
  email?: string;
  tenantId?: string;
  linkedAt: Date;
}

export interface IUser {
  email: string;
  passwordHash?: string;
  displayName: string;
  avatarUrl?: string;
  status: 'active' | 'disabled';
  /** Bump to invalidate every token issued before (password change, deactivation). */
  tokenVersion: number;
  emailVerified?: boolean;
  primaryProvider?: 'local' | 'google' | 'microsoft';
  providers: IAuthProvider[];
  googleId?: string;
  microsoftId?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export type UserRec = IUser & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const providerSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, enum: ['local', 'google', 'microsoft'], required: true },
    providerId: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    tenantId: { type: String },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const schema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: false, select: false }, // never returned unless explicitly selected; optional for pure OAuth users
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    avatarUrl: { type: String, trim: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    tokenVersion: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    primaryProvider: { type: String, enum: ['local', 'google', 'microsoft'], default: 'local' },
    providers: { type: [providerSchema], default: [] },
    googleId: { type: String, sparse: true, index: true },
    microsoftId: { type: String, sparse: true, index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

schema.index({ 'providers.provider': 1, 'providers.providerId': 1 });

export const User = model<IUser>('User', schema);
