import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, forbidden, unauthenticated } from '../errors';
import { assertCan, type Action } from '../security/permissions';
import { resolveAccessContext, type AccessContext } from '../security/context';
import { authenticateToken } from '../services/authService';
import { OBJECT_ID_RE } from '../validation/ids';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string };
      ctx?: AccessContext;
    }
  }
}

/** Wrap async route handlers so rejected promises reach errorHandler (Express 4 does not do this itself). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Step 1: verify the Bearer token or HttpOnly cookie (and re-check the user in the DB). Tokens are never read from URLs and never logged. */
export function authenticate(): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization;
    const match = typeof header === 'string' ? /^Bearer ([A-Za-z0-9._~+/=-]+)$/i.exec(header) : null;
    const cookieToken = (req as any).cookies?.brandguard_token;
    const token = match ? match[1] : cookieToken;
    if (!token) throw unauthenticated();
    req.auth = await authenticateToken(token);
    next();
  });
}

/**
 * Step 2: resolve the workspace from `req.params.workspaceId` or the `X-Workspace-Id` header, then look up the
 * caller's membership/role in the database. A client-supplied workspace id is never trusted on its own.
 */
export function workspaceContext(): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    if (!req.auth) throw unauthenticated();
    const raw = req.params.workspaceId ?? req.header('x-workspace-id');
    if (typeof raw !== 'string' || !OBJECT_ID_RE.test(raw)) throw forbidden('A valid workspace is required');
    req.ctx = await resolveAccessContext(req.auth.userId, raw);
    next();
  });
}

/** Step 3 (optional coarse gate): role must be allowed to perform `action`. Fine-grained rules live in repositories. */
export function requirePermission(action: Action): RequestHandler {
  return (req, _res, next) => {
    try {
      if (!req.ctx) throw unauthenticated();
      assertCan(req.ctx.role, action);
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Use inside handlers: the verified context, or a 401. */
export function getCtx(req: Request): AccessContext {
  if (!req.ctx) throw unauthenticated();
  return req.ctx;
}

/** Mount LAST. Never leaks stack traces, query text or request bodies. */
export function errorHandler(): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof AppError || err?.name === 'AppError' || (typeof err?.status === 'number' && err?.code)) {
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    if (err instanceof ZodError) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid request', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
      });
      return;
    }
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Malformed JSON body' } });
      return;
    }
    console.error('[unhandled error]', err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error');
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  };
}
