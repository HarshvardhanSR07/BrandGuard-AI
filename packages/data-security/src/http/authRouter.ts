import { Router } from 'express';
import { getEnv } from '../config/env';
import { createRateLimiter } from '../security/rateLimit';
import { changeOwnPassword, listMyWorkspaces, login } from '../services/authService';
import { asyncHandler, authenticate } from './middleware';

/**
 * Optional ready-made routes (mount with app.use('/api', createAuthRouter())):
 *   POST /api/auth/login        -> { token, expiresIn, user }
 *   GET  /api/me/workspaces     -> { workspaces: [{ workspaceId, name, brandName, role }] }
 *   POST /api/me/password       -> { currentPassword, newPassword } -> fresh { token, ... } (all other tokens revoked)
 * Member 1 may replace these; the services they call are the part that matters.
 */
export function createAuthRouter(): Router {
  const env = getEnv();
  const router = Router();
  const loginLimiter = createRateLimiter({
    windowMs: env.LOGIN_RATE_WINDOW_MS,
    max: env.LOGIN_RATE_MAX,
    keyFn: (req) => `${req.ip}|${typeof req.body?.email === 'string' ? req.body.email.toLowerCase().slice(0, 254) : ''}`,
  });

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  router.post('/auth/login', loginLimiter, asyncHandler(async (req, res) => {
    res.json(await login(req.body?.email, req.body?.password));
  }));

  router.get('/me/workspaces', authenticate(), asyncHandler(async (req, res) => {
    res.json({ workspaces: await listMyWorkspaces(req.auth!.userId) });
  }));

  // Changing a password needs the current one; limited per ip like login.
  const pwLimiter = createRateLimiter({ windowMs: env.LOGIN_RATE_WINDOW_MS, max: env.LOGIN_RATE_MAX });
  router.post('/me/password', pwLimiter, authenticate(), asyncHandler(async (req, res) => {
    res.json(await changeOwnPassword(req.auth!.userId, req.body));
  }));

  return router;
}
