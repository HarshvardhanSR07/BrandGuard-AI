import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters')
      .refine((s) => !/replace[_-]?with|change[_-]?me|secret123/i.test(s), 'JWT_SECRET still looks like a placeholder'),
    JWT_EXPIRES_IN: z.string().default('1h'),
    JWT_ISSUER: z.string().default('brandguard'),
    JWT_AUDIENCE: z.string().default('brandguard-api'),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
    AUDIT_HASH_CHAIN: z.enum(['on', 'off']).default('on'),
    MAX_EXTRACTED_TEXT_BYTES: z.coerce.number().int().positive().default(200_000),
    MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
    CORS_ORIGINS: z.string().default(''), // comma-separated allowlist, e.g. https://brandguard.vercel.app
    REQUIRE_COMPLETE_ANALYSIS_FOR_APPROVAL: z.enum(['on', 'off']).default('off'),
    LOGIN_RATE_MAX: z.coerce.number().int().positive().default(10),
    LOGIN_RATE_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  })
  .refine((e) => e.NODE_ENV !== 'production' || e.BCRYPT_COST >= 10, {
    message: 'BCRYPT_COST must be >= 10 in production',
    path: ['BCRYPT_COST'],
  });

export type Env = z.infer<typeof schema>;
let cached: Env | undefined;

/** Call once at startup. Throws (so the process refuses to start) if configuration is missing or unsafe. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}

export function getEnv(): Env {
  return cached ?? loadEnv();
}

export function resetEnvCache(): void {
  cached = undefined;
}
