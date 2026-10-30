import { Router } from 'express';
import { getEnv } from '../config/env';
import { createRateLimiter } from '../security/rateLimit';
import {
  changeOwnPassword,
  listMyWorkspaces,
  login,
  register,
  authenticateGoogle,
  authenticateMicrosoft,
  getCurrentUserProfile,
} from '../services/authService';
import { asyncHandler, authenticate } from './middleware';

export function createAuthRouter(): Router {
  const env = getEnv();
  const router = Router();

  const loginLimiter = createRateLimiter({
    windowMs: env.LOGIN_RATE_WINDOW_MS,
    max: env.LOGIN_RATE_MAX,
    keyFn: (req) => `${req.ip}|${typeof req.body?.email === 'string' ? req.body.email.toLowerCase().slice(0, 254) : ''}`,
  });

  const oauthLimiter = createRateLimiter({
    windowMs: env.LOGIN_RATE_WINDOW_MS,
    max: env.LOGIN_RATE_MAX,
    keyFn: (req) => `${req.ip}|oauth`,
  });

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  const setAuthCookie = (res: any, token: string) => {
    const isProd = env.NODE_ENV === 'production';
    res.cookie('brandguard_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  };

  // POST /api/auth/login
  router.post('/auth/login', loginLimiter, asyncHandler(async (req, res) => {
    const result = await login(req.body?.email, req.body?.password);
    setAuthCookie(res, result.token);
    res.json(result);
  }));

  // POST /api/auth/google
  router.post('/auth/google', oauthLimiter, asyncHandler(async (req, res) => {
    const idToken = req.body?.idToken || req.body?.credential || req.body?.token;
    const { linkAccount, password } = req.body || {};
    const result = await authenticateGoogle(idToken, { linkAccount, password });
    setAuthCookie(res, result.token);
    res.json(result);
  }));

  // POST /api/auth/microsoft
  router.post('/auth/microsoft', oauthLimiter, asyncHandler(async (req, res) => {
    const idToken = req.body?.idToken || req.body?.credential || req.body?.token;
    const { linkAccount, password } = req.body || {};
    const result = await authenticateMicrosoft(idToken, { linkAccount, password });
    setAuthCookie(res, result.token);
    res.json(result);
  }));

  // GET /api/auth/me
  router.get('/auth/me', authenticate(), asyncHandler(async (req, res) => {
    const user = await getCurrentUserProfile(req.auth!.userId);
    res.json({ user });
  }));

  // POST /api/auth/logout
  router.post('/auth/logout', (_req, res) => {
    const isProd = env.NODE_ENV === 'production';
    res.clearCookie('brandguard_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
    });
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // GET /api/me/workspaces
  router.get('/me/workspaces', authenticate(), asyncHandler(async (req, res) => {
    res.json({ workspaces: await listMyWorkspaces(req.auth!.userId) });
  }));

  // POST /api/me/password
  const pwLimiter = createRateLimiter({ windowMs: env.LOGIN_RATE_WINDOW_MS, max: env.LOGIN_RATE_MAX });
  router.post('/me/password', pwLimiter, authenticate(), asyncHandler(async (req, res) => {
    const result = await changeOwnPassword(req.auth!.userId, req.body);
    setAuthCookie(res, result.token);
    res.json(result);
  }));

  return router;
}
