/**
 * THE ONLY WRITER of audit events. appendAuditEvent is intentionally NOT exported from the package index,
 * and an architecture test enforces that nothing outside src/repositories and src/audit imports the AuditEvent model.
 * There is no update/delete function anywhere, and the model blocks them too.
 */
import mongoose from 'mongoose';
import { getEnv } from '../config/env';
import { AppError } from '../errors';
import { AuditEvent, Draft } from '../models';
import { assertCan } from '../security/permissions';
import { assertCtx, type AccessContext } from '../security/context';
import { SUBMITTED_PLUS } from '../security/stateMachine';
import type { AuditAction } from '../types';
import { auditListQuery } from '../validation/schemas';
import { computeEventHash, GENESIS_HASH, verifyEvents, type ChainedEvent, type ChainVerification } from './chain';

const T = mongoose.trusted;

export interface AuditInput {
  workspaceId: string;
  actorId: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  draftId?: string;
  /** Small, JSON-safe facts only (ids, statuses, counts). NEVER put draft text or other confidential content here. */
  meta?: Record<string, unknown>;
}

const MAX_META_BYTES = 4096;
const MAX_RETRIES = 30;

export async function appendAuditEvent(input: AuditInput): Promise<void> {
  const meta = JSON.parse(JSON.stringify(input.meta ?? {})) as Record<string, unknown>; // strips undefined/Dates
  if (Buffer.byteLength(JSON.stringify(meta)) > MAX_META_BYTES) throw new Error('audit meta too large');
  const chainOn = getEnv().AUDIT_HASH_CHAIN === 'on';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const last = await AuditEvent.findOne({ workspaceId: input.workspaceId }).sort({ seq: -1 }).select('seq hash').lean();
    const seq = (last?.seq ?? 0) + 1;
    const prevHash = chainOn ? last?.hash || GENESIS_HASH : '';
    const at = new Date();
    const hashable = {
      workspaceId: input.workspaceId,
      seq,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      draftId: input.draftId ?? null,
      at: at.toISOString(),
      meta,
    };
    try {
      await AuditEvent.create({
        ...hashable,
        at,
        prevHash,
        hash: chainOn ? computeEventHash(hashable, prevHash) : '',
      });
      return;
    } catch (err: any) {
      if (err?.code === 11000) {
        // another writer took this seq: jitter backoff and retry
        await new Promise((r) => setTimeout(r, 5 + Math.random() * 20));
        continue;
      }
      throw err;
    }
  }
  throw new AppError('CONFLICT', 'Could not append audit event (too much contention)', 409);
}

/** Ids of drafts that have left the 'draft' state, i.e. that non-admins may see. */
export async function submittedDraftIds(workspaceId: string): Promise<mongoose.Types.ObjectId[]> {
  return Draft.find({ workspaceId, status: T({ $in: [...SUBMITTED_PLUS] }) }).distinct('_id');
}

/**
 * Newest first. Admin sees everything. Reviewers see workspace-level events plus events of drafts that have been
 * submitted: creation/edit events of still-unsubmitted drafts are hidden from them (locked decision), so a reviewer's
 * view of the chain has gaps in `seq` by design.
 */
export async function listAuditEvents(ctx: AccessContext, query: unknown = {}) {
  assertCtx(ctx);
  assertCan(ctx.role, 'audit:read');
  const q = auditListQuery.parse(query);
  const filter: Record<string, unknown> = { workspaceId: ctx.workspaceId };
  if (q.beforeSeq) filter.seq = T({ $lt: q.beforeSeq });
  if (ctx.role !== 'admin') {
    const visible = await submittedDraftIds(ctx.workspaceId);
    filter.$or = [{ draftId: null }, { draftId: T({ $in: visible }) }];
  }
  return AuditEvent.find(filter).sort({ seq: -1 }).limit(q.limit).lean();
}

/** Admin-only: re-computes the whole workspace chain and reports the first broken link. */
export async function verifyChain(ctx: AccessContext): Promise<ChainVerification> {
  assertCtx(ctx);
  assertCan(ctx.role, 'membership:manage'); // admin-only capability
  const rows = await AuditEvent.find({ workspaceId: ctx.workspaceId }).sort({ seq: 1 }).lean();
  const events: ChainedEvent[] = rows.map((r) => ({
    workspaceId: String(r.workspaceId),
    seq: r.seq,
    actorId: r.actorId ? String(r.actorId) : null,
    action: r.action,
    targetType: r.targetType ?? null,
    targetId: r.targetId ?? null,
    draftId: r.draftId ? String(r.draftId) : null,
    at: new Date(r.at).toISOString(),
    meta: r.meta ?? {},
    prevHash: r.prevHash,
    hash: r.hash,
  }));
  return verifyEvents(events);
}
