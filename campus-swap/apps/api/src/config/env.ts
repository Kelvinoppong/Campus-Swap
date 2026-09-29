import { z } from 'zod';

/**
 * Every environment variable the API reads, validated once at boot. A missing
 * or malformed value crashes the process immediately rather than surfacing as
 * a confusing 500 on the first request that happens to need it.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  /** Two separate secrets so a leaked access secret cannot mint refresh tokens. */
  JWT_ACCESS_SECRET: z.string().min(32, 'Use at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Use at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /**
   * Server-side pepper mixed into the HMAC of each sign-in code. A 6-digit code
   * has little entropy on its own, so the hash must not be brute-forceable from
   * a database dump alone.
   */
  SIGN_IN_CODE_PEPPER: z.string().min(32, 'Use at least 32 characters'),

  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('Campus Swap <login@campusswap.app>'),

  /**
   * When true, sign-in codes are logged instead of emailed. Local development
   * only; the schema refuses it in production below.
   */
  MAIL_DRY_RUN: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
});

export type Env = z.infer<typeof envSchema>;

/**
 * DI token for the validated config. `Env` itself is a type, so it cannot be a
 * token; inject with `@Inject(ENV) private readonly env: Env`.
 */
export const ENV = Symbol('ENV');

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === 'production') {
    if (env.MAIL_DRY_RUN) {
      throw new Error('MAIL_DRY_RUN must be false in production');
    }
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required in production');
    }
  }

  return env;
}
