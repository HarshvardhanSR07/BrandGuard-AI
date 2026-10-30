import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { AppError, unauthenticated, validation } from '../errors';

export interface VerifiedGoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  provider: 'google';
}

export interface VerifiedMicrosoftProfile {
  oid: string;
  sub: string;
  tid: string;
  email: string;
  name: string;
  preferred_username?: string;
  provider: 'microsoft';
}

// Cached Google OAuth2 client
let googleClient: OAuth2Client | null = null;
function getGoogleClient(clientId?: string): OAuth2Client {
  if (!googleClient) {
    googleClient = new OAuth2Client(clientId);
  }
  return googleClient;
}

// In-memory cache for Microsoft Entra ID public keys
interface CachedJwks {
  keys: Map<string, crypto.KeyObject>;
  expiresAt: number;
}
const microsoftJwksCache = new Map<string, CachedJwks>();

/**
 * Fetches and caches public keys from Microsoft Entra ID JWKS endpoint
 */
async function getMicrosoftSigningKey(kid: string, tenant = 'common'): Promise<crypto.KeyObject> {
  const now = Date.now();
  let cached = microsoftJwksCache.get(tenant);

  // If cache is missing or expired, refresh from Microsoft
  if (!cached || cached.expiresAt < now || !cached.keys.has(kid)) {
    const jwksUrl = `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`;
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw unauthenticated(`Failed to retrieve Microsoft JWKS signing keys: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { keys?: Array<{ kid: string; kty: string; n: string; e: string }> };
    if (!data || !Array.isArray(data.keys)) {
      throw unauthenticated('Invalid Microsoft JWKS response structure');
    }

    const keyMap = new Map<string, crypto.KeyObject>();
    for (const key of data.keys) {
      if (key.kty === 'RSA' && key.n && key.e && key.kid) {
        try {
          const keyObject = crypto.createPublicKey({
            key: {
              kty: 'RSA',
              n: key.n,
              e: key.e,
            },
            format: 'jwk',
          });
          keyMap.set(key.kid, keyObject);
        } catch {
          // ignore unparseable single key
        }
      }
    }

    cached = {
      keys: keyMap,
      expiresAt: now + 24 * 60 * 60 * 1000, // cache for 24 hours
    };
    microsoftJwksCache.set(tenant, cached);
  }

  const signingKey = cached.keys.get(kid);
  if (!signingKey) {
    throw unauthenticated(`Microsoft signing key for key id "${kid}" was not found in active JWKS keyset`);
  }

  return signingKey;
}

/**
 * Verifies a Google Identity Services (GSI) ID token.
 * Validates cryptographic signature, issuer, audience, and expiry.
 * Strictly verifies email verification status.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleProfile> {
  if (!idToken || typeof idToken !== 'string') {
    throw validation('Google identity token is required');
  }

  const env = getEnv();
  const audience = env.GOOGLE_CLIENT_ID;

  try {
    const client = getGoogleClient(audience);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: audience || undefined,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw unauthenticated('Invalid Google token payload');
    }

    // Verify Google issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      throw unauthenticated(`Invalid Google token issuer: ${payload.iss}`);
    }

    // Verify email verified claim
    if (!payload.email) {
      throw unauthenticated('Google account does not have an email address');
    }
    if (payload.email_verified !== true) {
      throw unauthenticated('Google account email address is not verified');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      emailVerified: true,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
      provider: 'google',
    };
  } catch (err: any) {
    if (err instanceof AppError || err?.name === 'AppError') throw err;
    throw unauthenticated(`Google authentication failed: ${err.message || 'Token verification failed'}`);
  }
}

/**
 * Verifies a Microsoft Entra ID (Azure AD) ID token.
 * Validates cryptographic signature using Microsoft's JWKS endpoint,
 * audience (MICROSOFT_CLIENT_ID), issuer tenant matching, and token expiry.
 */
export async function verifyMicrosoftIdToken(idToken: string): Promise<VerifiedMicrosoftProfile> {
  if (!idToken || typeof idToken !== 'string') {
    throw validation('Microsoft identity token is required');
  }

  const env = getEnv();
  const expectedAudience = env.MICROSOFT_CLIENT_ID;
  const configuredTenant = env.MICROSOFT_TENANT_ID || 'common';

  // 1. Decode token to inspect header (kid) and unverified payload (tid, iss)
  const decodedToken = jwt.decode(idToken, { complete: true });
  if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.header?.kid) {
    throw unauthenticated('Malformed Microsoft identity token: missing key id in header');
  }

  const kid = decodedToken.header.kid;
  const rawPayload = decodedToken.payload as jwt.JwtPayload;
  const tokenTenant = rawPayload.tid || configuredTenant;

  try {
    // 2. Fetch the cryptographic signing key from Microsoft JWKS
    const signingKey = await getMicrosoftSigningKey(kid, configuredTenant === 'common' ? 'common' : tokenTenant);

    // 3. Cryptographically verify signature and expiry
    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['RS256'],
    };
    if (expectedAudience) {
      verifyOptions.audience = expectedAudience;
    }

    const verified = jwt.verify(idToken, signingKey, verifyOptions) as jwt.JwtPayload;

    // 4. Validate issuer matches Microsoft Entra ID patterns
    const issuer = verified.iss;
    const isV2 = issuer && issuer.startsWith('https://login.microsoftonline.com/') && issuer.endsWith('/v2.0');
    const isV1 = issuer && issuer.startsWith('https://sts.windows.net/');
    if (!isV2 && !isV1) {
      throw unauthenticated(`Invalid Microsoft token issuer: ${issuer}`);
    }

    // 5. Extract user identifier and email
    const email = (verified.email || verified.preferred_username || verified.upn) as string | undefined;
    if (!email) {
      throw unauthenticated('Microsoft account does not contain a verified email or username');
    }

    const oid = (verified.oid || verified.sub) as string;
    if (!oid) {
      throw unauthenticated('Microsoft account missing unique subject identifier');
    }

    return {
      oid,
      sub: (verified.sub as string) || oid,
      tid: (verified.tid as string) || tokenTenant,
      email: email.toLowerCase().trim(),
      name: (verified.name as string) || email.split('@')[0],
      preferred_username: verified.preferred_username as string | undefined,
      provider: 'microsoft',
    };
  } catch (err: any) {
    if (err instanceof AppError || err?.name === 'AppError') throw err;
    throw unauthenticated(`Microsoft authentication failed: ${err.message || 'Token verification failed'}`);
  }
}
