import { Schema, model, type Types } from 'mongoose';
import { makeAppendOnly } from './appendOnly';

export interface IAuditEvent {
  workspaceId: Types.ObjectId;
  seq: number;
  actorId: Types.ObjectId | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  /** Set for events about a specific draft. Reviewers only see such events once the draft has been submitted. */
  draftId: Types.ObjectId | null;
  at: Date;
  meta: Record<string, unknown>;
  prevHash: string;
  hash: string; // '' only when AUDIT_HASH_CHAIN=off
}
export type AuditEventRec = IAuditEvent & { _id: Types.ObjectId };

// minimize:false keeps empty `meta: {}` objects so the stored document hashes identically when read back.
const schema = new Schema<IAuditEvent>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    seq: { type: Number, required: true, min: 1 },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
    draftId: { type: Schema.Types.ObjectId, ref: 'Draft', default: null },
    at: { type: Date, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    prevHash: { type: String, required: true },
    hash: { type: String, default: '' },
  },
  { timestamps: false, minimize: false },
);
// Two concurrent writers can never both claim the same seq: the loser gets E11000 and retries.
schema.index({ workspaceId: 1, seq: 1 }, { unique: true });
schema.index({ workspaceId: 1, draftId: 1, seq: -1 });
makeAppendOnly(schema, 'AuditEvent');

export const AuditEvent = model<IAuditEvent>('AuditEvent', schema);
