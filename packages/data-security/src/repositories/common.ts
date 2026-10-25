import { createHash } from 'crypto';
import mongoose from 'mongoose';

/** Marks an operator object as safe so global sanitizeFilter does not neutralise it. Use ONLY on server-built objects. */
export const T = mongoose.trusted;

export const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

/** `lean()` results are plain objects; this just gives them our record type. */
export const asRec = <R>(doc: unknown): R | null => (doc ?? null) as R | null;
export const asRecs = <R>(docs: unknown): R[] => (docs ?? []) as R[];

/** A record counts as "current" when active and inside its effective window. */
export function isCurrent(r: { status: string; effectiveFrom: Date; effectiveTo?: Date | null }, now = new Date()): boolean {
  return r.status === 'active' && r.effectiveFrom <= now && (!r.effectiveTo || r.effectiveTo > now);
}
