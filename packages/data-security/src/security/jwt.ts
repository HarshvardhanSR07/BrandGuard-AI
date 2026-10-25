import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { unauthenticated } from '../errors';
import { OBJECT_ID_RE } from '../validation/ids';

/** The token carries identity ONLY: user id + tokenVersion. Never roles or workspaces (those come from the DB). */
export interface AccessClaims {
  sub: string;
  tv: number;
}

export function signAccessToken(claims: AccessClaims): { token: string; expiresIn: string } {
  const env = getEnv();
  const token = jwt.sign({ tv: claims.tv }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: claims.sub,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { token, expiresIn: env.JWT_EXPIRES_IN };
}

export function verifyAccessToken(token: string): AccessClaims {
  const env = getEnv();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'], // pinned: rejects "alg":"none" and algorithm-confusion tricks
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || !OBJECT_ID_RE.test(payload.sub) || typeof payload.tv !== 'number') {
      throw new Error('bad claims');
    }
    return { sub: payload.sub, tv: payload.tv };
  } catch {
    // One generic message: never reveal whether it was expired, tampered or malformed.
    throw unauthenticated('Invalid or expired token');
  }
}
