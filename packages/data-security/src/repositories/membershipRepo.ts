import { conflict, notFound } from '../errors';
import { appendAuditEvent } from '../audit/auditLog';
import { Membership, User } from '../models';
import { assertCtx, type AccessContext } from '../security/context';
import { assertCan } from '../security/permissions';
import { assertObjectId } from '../validation/ids';
import { T } from './common';
import { addMemberBody, changeRoleBody } from '../validation/schemas';

async function activeAdminCount(workspaceId: string): Promise<number> {
  return Membership.countDocuments({ workspaceId, role: 'admin', status: 'active' });
}

/** Admin only. Lists the workspace's memberships with the user's email/name. */
export async function listMembers(ctx: AccessContext) {
  assertCtx(ctx);
  assertCan(ctx.role, 'membership:manage');
  const rows = await Membership.find({ workspaceId: ctx.workspaceId, status: 'active' }).lean();
  const users = await User.find({ _id: T({ $in: rows.map((r) => r.userId) }) }).select('email displayName').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return rows.map((r) => ({
    userId: String(r.userId),
    email: byId.get(String(r.userId))?.email,
    displayName: byId.get(String(r.userId))?.displayName,
    role: r.role,
  }));
}

/** Assign an EXISTING seeded user (looked up by email). This never creates accounts. */
export async function addMember(ctx: AccessContext, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'membership:manage');
  const body = addMemberBody.parse(input);
  const user = await User.findOne({ email: body.email, status: 'active' }).select('_id').lean();
  if (!user) throw notFound('User'); // do not create accounts, do not reveal more
  const existing = await Membership.findOne({ userId: user._id, workspaceId: ctx.workspaceId }).lean();
  if (existing?.status === 'active') throw conflict('User is already a member of this workspace');
  if (existing) {
    await Membership.updateOne({ _id: existing._id, workspaceId: ctx.workspaceId }, { $set: { status: 'active', role: body.role, addedBy: ctx.userId } });
  } else {
    await Membership.create({ userId: user._id, workspaceId: ctx.workspaceId, role: body.role, status: 'active', addedBy: ctx.userId });
  }
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'membership.added',
    targetType: 'user', targetId: String(user._id), meta: { role: body.role },
  });
  return { userId: String(user._id), role: body.role };
}

export async function changeRole(ctx: AccessContext, userId: string, input: unknown) {
  assertCtx(ctx);
  assertCan(ctx.role, 'membership:manage');
  assertObjectId(userId, 'userId');
  const { role } = changeRoleBody.parse(input);
  const current = await Membership.findOne({ userId, workspaceId: ctx.workspaceId, status: 'active' }).lean();
  if (!current) throw notFound('Member');
  if (current.role === role) return { userId, role };
  await Membership.updateOne({ _id: current._id, workspaceId: ctx.workspaceId }, { $set: { role } });
  if (current.role === 'admin' && (await activeAdminCount(ctx.workspaceId)) === 0) {
    await Membership.updateOne({ _id: current._id, workspaceId: ctx.workspaceId }, { $set: { role: 'admin' } }); // revert
    throw conflict('A workspace must keep at least one active admin');
  }
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'membership.role_changed',
    targetType: 'user', targetId: userId, meta: { from: current.role, to: role },
  });
  return { userId, role };
}

/** Soft-removes (status 'removed'); the user's content stays for audit. The last active admin can never be removed. */
export async function removeMember(ctx: AccessContext, userId: string) {
  assertCtx(ctx);
  assertCan(ctx.role, 'membership:manage');
  assertObjectId(userId, 'userId');
  const current = await Membership.findOne({ userId, workspaceId: ctx.workspaceId, status: 'active' }).lean();
  if (!current) throw notFound('Member');
  if (current.role === 'admin' && (await activeAdminCount(ctx.workspaceId)) <= 1) {
    throw conflict('A workspace must keep at least one active admin');
  }
  await Membership.updateOne({ _id: current._id, workspaceId: ctx.workspaceId }, { $set: { status: 'removed' } });
  // Re-check after the write: two admins removing each other concurrently must not leave zero admins.
  if (current.role === 'admin' && (await activeAdminCount(ctx.workspaceId)) === 0) {
    await Membership.updateOne({ _id: current._id, workspaceId: ctx.workspaceId }, { $set: { status: 'active' } });
    throw conflict('A workspace must keep at least one active admin');
  }
  await appendAuditEvent({
    workspaceId: ctx.workspaceId, actorId: ctx.userId, action: 'membership.removed',
    targetType: 'user', targetId: userId, meta: { role: current.role },
  });
  return { userId, removed: true };
}
