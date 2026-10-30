/**
 * Public surface of the BrandGuard database + security package.
 * Routes should import ONLY from here. Models and internal audit helpers are deliberately not exported.
 */
import './db/connect'; // applies sanitizeFilter + strictQuery('throw') before any model is used

export { loadEnv, getEnv, type Env } from './config/env';
export { connectDb, disconnectDb } from './db/connect';

export * from './types';
export { AppError, type ErrorCode } from './errors';
export * from './validation/schemas';
export { assertObjectId } from './validation/ids';

// security
export { can, assertCan, canReadDraft, ACTIONS, type Action } from './security/permissions';
export { TRANSITIONS, DECISION_TO_STATUS, canTransition } from './security/stateMachine';
export { resolveAccessContext, type AccessContext } from './security/context';
export { hashPassword } from './security/password';
export { createRateLimiter } from './security/rateLimit';
export {
  login,
  register,
  authenticateGoogle,
  authenticateMicrosoft,
  getCurrentUserProfile,
  authenticateToken,
  listMyWorkspaces,
  revokeAllTokens,
  changeOwnPassword,
  deactivateUser,
  type LoginResult,
  type UserProfileResponse,
} from './services/authService';
export * as oauthVerifier from './security/oauthVerifier';
export { verifyGoogleIdToken, verifyMicrosoftIdToken, type VerifiedGoogleProfile, type VerifiedMicrosoftProfile } from './security/oauthVerifier';

// express glue
export { authenticate, workspaceContext, requirePermission, getCtx, asyncHandler, errorHandler } from './http/middleware';
export { createAuthRouter } from './http/authRouter';
export { securityHeaders, corsAllowlist } from './http/securityHeaders';

// repositories (every function takes an AccessContext first)
export * as drafts from './repositories/draftRepo';
export * as analyses from './repositories/analysisRepo';
export * as reviews from './repositories/reviewRepo';
export * as uploads from './repositories/uploadRepo';
export * as analytics from './repositories/analyticsRepo';
export * as members from './repositories/membershipRepo';
export { policyRepo as policies } from './repositories/policyRepo';
export { factRepo as facts } from './repositories/factRepo';

// audit (read + verify only)
export { listAuditEvents, verifyChain } from './audit/auditLog';
