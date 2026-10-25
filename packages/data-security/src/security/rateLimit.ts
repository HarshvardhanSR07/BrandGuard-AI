import type { Request, RequestHandler } from 'express';
import { AppError } from '../errors';

interface Options {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
}

/** Minimal in-memory fixed-window limiter. Per process: fine for a single Render instance, not for a cluster. */
export function createRateLimiter({ windowMs, max, keyFn }: Options): RequestHandler & { reset(): void } {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const handler: RequestHandler = (req, res, next) => {
    const now = Date.now();
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    const key = keyFn ? keyFn(req) : req.ip ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return next(new AppError('RATE_LIMITED', 'Too many attempts, try again later', 429));
    }
    next();
  };
  return Object.assign(handler, { reset: () => hits.clear() });
}
