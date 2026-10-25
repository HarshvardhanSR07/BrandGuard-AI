import { unauthenticated } from '../errors';
import { T } from '../repositories/common';
import { Membership, User, Workspace } from '../models';
import { dummyHash, hashPassword, verifyPassword } from '../security/password';
import { signAccessToken, verifyAccessToken } from '../security/jwt';
import { changePasswordBody, loginBody } from '../validation/schemas';
import { assertObjectId } from '../validation/ids';

export interface LoginResult {
  token: string;
  expiresIn: string;
  user: { id: string; email: string; displayName: string };
}

/**
 * Seeded accounts only (no signup exists). Unknown email, wrong password and disabled account all produce the
 * SAME error, and a bcrypt comparison always runs, so neither the message nor the timing reveals which one it was.
 */
export async function login(emailInput: unknown, passwordInput: unknown): Promise<LoginResult> {
  const { email, password } = loginBody.parse({ email: emailInput, password: passwordInput });
  const user = await User.findOne({ email }).select('+passwordHash').lean();
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !passwordOk || user.status !== 'active') throw unauthenticated('Invalid email or password');
  const { token, expiresIn } = signAccessToken({ sub: String(user._id), tv: user.tokenVersion });
  return { token, expiresIn, user: { id: String(user._id), email: user.email, displayName: user.displayName } };
}

/** Verifies the JWT AND re-checks the user in the database (still active, tokenVersion unchanged). */
export async function authenticateToken(token: string): Promise<{ userId: string }> {
  const claims = verifyAccessToken(token);
  const user = await User.findOne({ _id: claims.sub }).select('status tokenVersion').lean();
  if (!user || user.status !== 'active' || user.tokenVersion !== claims.tv) {
    throw unauthenticated('Invalid or expired token');
  }
  return { userId: claims.sub };
}

/** Workspaces the user actively belongs to, with the role in each. Backs GET /api/me/workspaces. */
export async function listMyWorkspaces(userId: string): Promise<Array<{ workspaceId: string; name: string; brandName: string; role: string }>> {
  assertObjectId(userId, 'userId');
  const memberships = await Membership.find({ userId, status: 'active' }).lean();
  if (memberships.length === 0) return [];
  const workspaces = await Workspace.find({ status: 'active', _id: T({ $in: memberships.map((m) => m.workspaceId) }) }).lean();
  const byId = new Map(workspaces.map((w) => [String(w._id), w]));
  return memberships.flatMap((m) => {
    const w = byId.get(String(m.workspaceId));
    return w ? [{ workspaceId: String(w._id), name: w.name, brandName: w.brandName, role: m.role }] : [];
  });
}

/** Invalidate every token the user has (password change, offboarding). */
export async function revokeAllTokens(userId: string): Promise<void> {
  assertObjectId(userId, 'userId');
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

/**
 * Self-service password change. Verifies the current password, stores the new hash and bumps tokenVersion so every
 * OTHER session/token dies; returns a fresh token for the caller so they stay signed in.
 */
export async function changeOwnPassword(userId: string, input: unknown): Promise<LoginResult> {
  assertObjectId(userId, 'userId');
  const body = changePasswordBody.parse(input);
  const user = await User.findOne({ _id: userId, status: 'active' }).select('+passwordHash').lean();
  if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) throw unauthenticated('Invalid password');
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(body.newPassword) }, $inc: { tokenVersion: 1 } },
    { new: true },
  ).lean();
  const { token, expiresIn } = signAccessToken({ sub: userId, tv: updated!.tokenVersion });
  return { token, expiresIn, user: { id: userId, email: user.email, displayName: user.displayName } };
}

/** Ops use (see src/seed/deactivateUser.ts): disable the account and invalidate all its tokens. */
export async function deactivateUser(userId: string): Promise<void> {
  assertObjectId(userId, 'userId');
  await User.updateOne({ _id: userId }, { $set: { status: 'disabled' }, $inc: { tokenVersion: 1 } });
}
