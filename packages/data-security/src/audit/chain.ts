/**
 * Pure hash-chain logic for the audit log (no database access, fully unit-testable).
 *
 * hash = SHA-256( canonicalJson(event fields) + "|" + prevHash )
 * Each workspace has its own chain, numbered by `seq` starting at 1; the first event links to GENESIS_HASH.
 *
 * LIMITS (documented on purpose): a chain detects edits, deletions in the middle and re-ordering. It does NOT
 * detect truncation of the tail, and an attacker with full database write access can recompute every hash.
 * Mitigation for later: periodically store the head hash somewhere the database user cannot write.
 */
import { createHash } from 'crypto';

export const GENESIS_HASH = '0'.repeat(64);

export interface HashableEvent {
  workspaceId: string;
  seq: number;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  draftId: string | null;
  at: string; // ISO-8601
  meta: unknown;
}

export interface ChainedEvent extends HashableEvent {
  prevHash: string;
  hash: string;
}

/** JSON with recursively sorted keys; `undefined` object values are dropped (as JSON.stringify would). */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v === undefined ? null : v)).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}

export function computeEventHash(e: HashableEvent, prevHash: string): string {
  // Pick ONLY the hashed fields (callers may pass objects that also carry prevHash/hash).
  // Storage may drop an empty meta; treat missing as {}.
  const normalised = {
    workspaceId: e.workspaceId, seq: e.seq, actorId: e.actorId, action: e.action, targetType: e.targetType,
    targetId: e.targetId, draftId: e.draftId, at: e.at, meta: e.meta ?? {},
  };
  return createHash('sha256').update(`${canonicalJson(normalised)}|${prevHash}`).digest('hex');
}

export type ChainVerification =
  | { ok: true; count: number; headSeq: number | null; headHash: string }
  | { ok: false; brokenAtSeq: number; reason: string };

/** `events` must be ordered by seq ascending and be the COMPLETE chain of one workspace. */
export function verifyEvents(events: readonly ChainedEvent[]): ChainVerification {
  let expectedSeq = 1;
  let prevHash = GENESIS_HASH;
  for (const e of events) {
    if (e.seq !== expectedSeq) {
      return { ok: false, brokenAtSeq: expectedSeq, reason: `expected seq ${expectedSeq} but found ${e.seq} (event missing or reordered)` };
    }
    if (e.prevHash !== prevHash) {
      return { ok: false, brokenAtSeq: e.seq, reason: 'prevHash does not match the previous event' };
    }
    if (computeEventHash(e, e.prevHash) !== e.hash) {
      return { ok: false, brokenAtSeq: e.seq, reason: 'event content does not match its hash (modified)' };
    }
    prevHash = e.hash;
    expectedSeq += 1;
  }
  return { ok: true, count: events.length, headSeq: events.length ? events[events.length - 1].seq : null, headHash: prevHash };
}
