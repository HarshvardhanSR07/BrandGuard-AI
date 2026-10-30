import { unauthenticated, conflict, accountLinkingRequired } from '../errors';
import { T } from '../repositories/common';
import { Membership, User, Workspace } from '../models';
import { dummyHash, hashPassword, verifyPassword } from '../security/password';
import { signAccessToken, verifyAccessToken } from '../security/jwt';
import { changePasswordBody, loginBody } from '../validation/schemas';
import { assertObjectId } from '../validation/ids';
import * as oauthVerifier from '../security/oauthVerifier';

export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status: string;
  emailVerified?: boolean;
  primaryProvider?: string;
  providers?: Array<{ provider: string; providerId: string; email?: string; linkedAt: Date }>;
  createdAt?: Date;
  lastLoginAt?: Date;
}

export interface LoginResult {
  token: string;
  expiresIn: string;
  user: UserProfileResponse;
  isNewUser?: boolean;
}

/**
 * Ensures a user is assigned to at least one active workspace upon registration.
 */
async function ensureDefaultWorkspaceMembership(userId: string): Promise<void> {
  const existing = await Membership.findOne({ userId, status: 'active' });
  if (existing) return;

  let workspace = await Workspace.findOne({ status: 'active' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Acme Cloud Platform',
      brandName: 'Acme Global (Default)',
      status: 'active',
      isSynthetic: false,
    });
  }

  await Membership.create({
    userId,
    workspaceId: workspace._id,
    role: 'creator',
    status: 'active',
  });
}

/**
 * Standard email & password registration.
 */
export async function register(
  nameInput: unknown,
  emailInput: unknown,
  passwordInput: unknown,
): Promise<LoginResult> {
  const { email, password } = loginBody.parse({ email: emailInput, password: passwordInput });
  const displayName = typeof nameInput === 'string' && nameInput.trim() ? nameInput.trim() : email.split('@')[0];

  const existing = await User.findOne({ email });
  if (existing) {
    throw conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    displayName,
    status: 'active',
    tokenVersion: 0,
    emailVerified: false,
    primaryProvider: 'local',
    providers: [
      {
        provider: 'local',
        providerId: email,
        email,
        linkedAt: new Date(),
      },
    ],
    lastLoginAt: new Date(),
  });

  await ensureDefaultWorkspaceMembership(String(user._id));

  const { token, expiresIn } = signAccessToken({ sub: String(user._id), tv: user.tokenVersion });
  return {
    token,
    expiresIn,
    isNewUser: true,
    user: {
      id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      emailVerified: user.emailVerified,
      primaryProvider: user.primaryProvider,
      providers: user.providers,
      createdAt: (user as any).createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  };
}

/**
 * Standard email & password authentication.
 */
export async function login(emailInput: unknown, passwordInput: unknown): Promise<LoginResult> {
  const { email, password } = loginBody.parse({ email: emailInput, password: passwordInput });
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !passwordOk || user.status !== 'active') throw unauthenticated('Invalid email or password');

  user.lastLoginAt = new Date();
  await user.save();

  const { token, expiresIn } = signAccessToken({ sub: String(user._id), tv: user.tokenVersion });
  return {
    token,
    expiresIn,
    user: {
      id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      primaryProvider: user.primaryProvider,
      providers: user.providers,
      createdAt: (user as any).createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  };
}

/**
 * Google OAuth Authentication with safe account linking.
 */
export async function authenticateGoogle(
  idToken: string,
  options?: { linkAccount?: boolean; password?: string; currentUserId?: string },
): Promise<LoginResult> {
  const profile = await oauthVerifier.verifyGoogleIdToken(idToken);

  // 1. Check if user exists with this Google provider ID
  let user = await User.findOne({
    $or: [
      { googleId: profile.sub },
      { 'providers.provider': 'google', 'providers.providerId': profile.sub },
    ],
  }).select('+passwordHash');

  if (user) {
    if (user.status !== 'active') throw unauthenticated('Account is disabled');
    user.lastLoginAt = new Date();
    if (profile.picture && !user.avatarUrl) {
      user.avatarUrl = profile.picture;
    }
    await user.save();

    const { token, expiresIn } = signAccessToken({ sub: String(user._id), tv: user.tokenVersion });
    return {
      token,
      expiresIn,
      user: {
        id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerified: user.emailVerified,
        primaryProvider: user.primaryProvider,
        providers: user.providers,
        createdAt: (user as any).createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  // 2. User with this Google sub not found; check by email
  const existingByEmail = await User.findOne({ email: profile.email }).select('+passwordHash');

  if (existingByEmail) {
    // If not explicitly linking, require confirmation & proof of ownership
    if (!options?.linkAccount) {
      throw accountLinkingRequired(
        'An account with this email already exists. Please authenticate with your existing credentials to link your Google account.',
        {
          email: profile.email,
          existingProvider: existingByEmail.primaryProvider || 'local',
        },
      );
    }

    // Safe linking: if password is provided, verify it; or verify current authenticated user matches
    if (existingByEmail.passwordHash && options.password) {
      const pwOk = await verifyPassword(options.password, existingByEmail.passwordHash);
      if (!pwOk) {
        throw unauthenticated('Invalid existing account password for account linking');
      }
    } else if (options.currentUserId && String(existingByEmail._id) !== options.currentUserId) {
      throw unauthenticated('Current session does not match the account being linked');
    }

    // Attach Google to providers
    existingByEmail.googleId = profile.sub;
    if (!existingByEmail.avatarUrl && profile.picture) {
      existingByEmail.avatarUrl = profile.picture;
    }
    existingByEmail.emailVerified = true;
    existingByEmail.lastLoginAt = new Date();
    if (!existingByEmail.providers) {
      existingByEmail.providers = [];
    }
    existingByEmail.providers.push({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      linkedAt: new Date(),
    });
    await existingByEmail.save();

    const { token, expiresIn } = signAccessToken({
      sub: String(existingByEmail._id),
      tv: existingByEmail.tokenVersion,
    });
    return {
      token,
      expiresIn,
      user: {
        id: String(existingByEmail._id),
        email: existingByEmail.email,
        displayName: existingByEmail.displayName,
        avatarUrl: existingByEmail.avatarUrl,
        status: existingByEmail.status,
        emailVerified: existingByEmail.emailVerified,
        primaryProvider: existingByEmail.primaryProvider,
        providers: existingByEmail.providers,
        createdAt: (existingByEmail as any).createdAt,
        lastLoginAt: existingByEmail.lastLoginAt,
      },
    };
  }

  // 3. New User Registration via Google
  const newUser = await User.create({
    email: profile.email,
    displayName: profile.name,
    avatarUrl: profile.picture,
    status: 'active',
    tokenVersion: 0,
    emailVerified: true,
    primaryProvider: 'google',
    googleId: profile.sub,
    providers: [
      {
        provider: 'google',
        providerId: profile.sub,
        email: profile.email,
        linkedAt: new Date(),
      },
    ],
    lastLoginAt: new Date(),
  });

  await ensureDefaultWorkspaceMembership(String(newUser._id));

  const { token, expiresIn } = signAccessToken({ sub: String(newUser._id), tv: newUser.tokenVersion });
  return {
    token,
    expiresIn,
    isNewUser: true,
    user: {
      id: String(newUser._id),
      email: newUser.email,
      displayName: newUser.displayName,
      avatarUrl: newUser.avatarUrl,
      status: newUser.status,
      emailVerified: newUser.emailVerified,
      primaryProvider: newUser.primaryProvider,
      providers: newUser.providers,
      createdAt: (newUser as any).createdAt,
      lastLoginAt: newUser.lastLoginAt,
    },
  };
}

/**
 * Microsoft OAuth Authentication with safe account linking.
 */
export async function authenticateMicrosoft(
  idToken: string,
  options?: { linkAccount?: boolean; password?: string; currentUserId?: string },
): Promise<LoginResult> {
  const profile = await oauthVerifier.verifyMicrosoftIdToken(idToken);

  // 1. Check if user exists with this Microsoft provider ID
  let user = await User.findOne({
    $or: [
      { microsoftId: profile.oid },
      { 'providers.provider': 'microsoft', 'providers.providerId': profile.oid },
    ],
  }).select('+passwordHash');

  if (user) {
    if (user.status !== 'active') throw unauthenticated('Account is disabled');
    user.lastLoginAt = new Date();
    await user.save();

    const { token, expiresIn } = signAccessToken({ sub: String(user._id), tv: user.tokenVersion });
    return {
      token,
      expiresIn,
      user: {
        id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerified: user.emailVerified,
        primaryProvider: user.primaryProvider,
        providers: user.providers,
        createdAt: (user as any).createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  // 2. User with this Microsoft ID not found; check by email
  const existingByEmail = await User.findOne({ email: profile.email }).select('+passwordHash');

  if (existingByEmail) {
    if (!options?.linkAccount) {
      throw accountLinkingRequired(
        'An account with this email already exists. Please authenticate with your existing credentials to link your Microsoft account.',
        {
          email: profile.email,
          existingProvider: existingByEmail.primaryProvider || 'local',
        },
      );
    }

    if (existingByEmail.passwordHash && options.password) {
      const pwOk = await verifyPassword(options.password, existingByEmail.passwordHash);
      if (!pwOk) {
        throw unauthenticated('Invalid existing account password for account linking');
      }
    } else if (options.currentUserId && String(existingByEmail._id) !== options.currentUserId) {
      throw unauthenticated('Current session does not match the account being linked');
    }

    // Attach Microsoft to providers
    existingByEmail.microsoftId = profile.oid;
    existingByEmail.emailVerified = true;
    existingByEmail.lastLoginAt = new Date();
    if (!existingByEmail.providers) {
      existingByEmail.providers = [];
    }
    existingByEmail.providers.push({
      provider: 'microsoft',
      providerId: profile.oid,
      email: profile.email,
      tenantId: profile.tid,
      linkedAt: new Date(),
    });
    await existingByEmail.save();

    const { token, expiresIn } = signAccessToken({
      sub: String(existingByEmail._id),
      tv: existingByEmail.tokenVersion,
    });
    return {
      token,
      expiresIn,
      user: {
        id: String(existingByEmail._id),
        email: existingByEmail.email,
        displayName: existingByEmail.displayName,
        avatarUrl: existingByEmail.avatarUrl,
        status: existingByEmail.status,
        emailVerified: existingByEmail.emailVerified,
        primaryProvider: existingByEmail.primaryProvider,
        providers: existingByEmail.providers,
        createdAt: (existingByEmail as any).createdAt,
        lastLoginAt: existingByEmail.lastLoginAt,
      },
    };
  }

  // 3. New User Registration via Microsoft
  const newUser = await User.create({
    email: profile.email,
    displayName: profile.name,
    status: 'active',
    tokenVersion: 0,
    emailVerified: true,
    primaryProvider: 'microsoft',
    microsoftId: profile.oid,
    providers: [
      {
        provider: 'microsoft',
        providerId: profile.oid,
        email: profile.email,
        tenantId: profile.tid,
        linkedAt: new Date(),
      },
    ],
    lastLoginAt: new Date(),
  });

  await ensureDefaultWorkspaceMembership(String(newUser._id));

  const { token, expiresIn } = signAccessToken({ sub: String(newUser._id), tv: newUser.tokenVersion });
  return {
    token,
    expiresIn,
    isNewUser: true,
    user: {
      id: String(newUser._id),
      email: newUser.email,
      displayName: newUser.displayName,
      avatarUrl: newUser.avatarUrl,
      status: newUser.status,
      emailVerified: newUser.emailVerified,
      primaryProvider: newUser.primaryProvider,
      providers: newUser.providers,
      createdAt: (newUser as any).createdAt,
      lastLoginAt: newUser.lastLoginAt,
    },
  };
}

/**
 * Returns full profile of the authenticated user.
 */
export async function getCurrentUserProfile(userId: string): Promise<UserProfileResponse> {
  assertObjectId(userId, 'userId');
  const user = await User.findById(userId).lean();
  if (!user || user.status !== 'active') {
    throw unauthenticated('User not found or disabled');
  }

  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    emailVerified: user.emailVerified,
    primaryProvider: user.primaryProvider,
    providers: user.providers,
    createdAt: (user as any).createdAt,
    lastLoginAt: user.lastLoginAt,
  };
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
  if (!user || !user.passwordHash || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
    throw unauthenticated('Invalid password');
  }
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(body.newPassword) }, $inc: { tokenVersion: 1 } },
    { new: true },
  ).lean();
  const { token, expiresIn } = signAccessToken({ sub: userId, tv: updated!.tokenVersion });
  return {
    token,
    expiresIn,
    user: {
      id: userId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      primaryProvider: user.primaryProvider,
      providers: user.providers,
      createdAt: (user as any).createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  };
}

/** Ops use (see src/seed/deactivateUser.ts): disable the account and invalidate all its tokens. */
export async function deactivateUser(userId: string): Promise<void> {
  assertObjectId(userId, 'userId');
  await User.updateOne({ _id: userId }, { $set: { status: 'disabled' }, $inc: { tokenVersion: 1 } });
}
