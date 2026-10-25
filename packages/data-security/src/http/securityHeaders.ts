import type { RequestHandler } from 'express';

/** Dependency-free API hardening headers (equivalent to the useful parts of helmet for a JSON API). Mount first. */
export function securityHeaders(): RequestHandler {
  return (_req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
  };
}

/**
 * CORS allowlist for the Vercel frontend. Bearer-header auth => no cookies/credentials needed, so we never send
 * Access-Control-Allow-Credentials. Unlisted origins get no CORS headers (browser blocks them). Never use "*".
 * `origins` normally comes from env CORS_ORIGINS (comma-separated).
 */
export function corsAllowlist(origins: string | string[]): RequestHandler {
  const allowed = new Set((Array.isArray(origins) ? origins : origins.split(',')).map((o) => o.trim().replace(/\/$/, '')).filter(Boolean));
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && allowed.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Workspace-Id');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  };
}
