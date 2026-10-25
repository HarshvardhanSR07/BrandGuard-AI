import mongoose from 'mongoose';
import { forbidden } from '../errors';
import { Membership, Workspace } from '../models';
import type { Role } from '../types';
import { assertObjectId } from '../validation/ids';

declare const brand: unique symbol;

/**
 * Proof that "this user is an ACTIVE member of this workspace with this role", read from the database.
 * Every repository function takes one as its first argument, so a query without a workspace scope cannot be written.
 * Contexts can only be created by resolveAccessContext (checked at runtime with a WeakSet, so a hand-built object
 * is rejected even from plain JavaScript).
 */
export interface AccessContext {
  readonly userId: string;
  readonly workspaceId: string;
  readonly role: Role;
  readonly [brand]: true;
}

const issued = new WeakSet<object>();

export async function resolveAccessContext(userId: string, workspaceId: string): Promise<AccessContext> {
  assertObjectId(userId, 'userId');
  assertObjectId(workspaceId, 'workspaceId');
  const membership = await Membership.findOne({ userId, workspaceId, status: 'active' }).lean();
  const workspace = membership ? await Workspace.findOne({ _id: workspaceId, status: 'active' }).lean() : null;
  // Same answer whether the workspace does not exist, is archived, or the user simply is not a member.
  if (!membership || !workspace) throw forbidden('You are not a member of this workspace');
  const ctx = Object.freeze({ userId, workspaceId, role: membership.role }) as unknown as AccessContext;
  issued.add(ctx);
  return ctx;
}

/** Runtime guard used at the top of every repository function. */
export function assertCtx(ctx: AccessContext): void {
  if (!ctx || typeof ctx !== 'object' || !issued.has(ctx)) {
    throw new Error('Invalid AccessContext: obtain one with resolveAccessContext()');
  }
}

/** Needed by aggregation pipelines, which (unlike find) do not cast string ids. */
export const wsObjectId = (ctx: AccessContext) => new mongoose.Types.ObjectId(ctx.workspaceId);
