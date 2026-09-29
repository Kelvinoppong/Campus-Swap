import { z } from 'zod';
import { LIMITS, USER_ROLES, USER_STATUSES } from './constants';

/**
 * Sign-in is a one-time code sent to a .edu address. We never check the domain
 * against a hard-coded list on the client: the API decides, because the set of
 * supported schools lives in the `schools` table.
 */
export const eduEmailSchema = z
  .email({ message: 'Enter a valid email address' })
  .max(254)
  .transform((value) => value.trim().toLowerCase())
  .refine((value) => value.endsWith('.edu'), {
    message: 'Use your school email address ending in .edu',
  });

export const requestCodeSchema = z.object({
  email: eduEmailSchema,
});
export type RequestCodeInput = z.infer<typeof requestCodeSchema>;

export interface RequestCodeResponse {
  /** Always true for a well-formed .edu address, so we never leak who has an account. */
  sent: true;
  expiresInSeconds: number;
}

export const verifyCodeSchema = z.object({
  email: eduEmailSchema,
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${LIMITS.signInCodeLength}}$`), {
      message: `Enter the ${LIMITS.signInCodeLength}-digit code`,
    }),
  /** Expo push token, if the device already granted notification permission. */
  pushToken: z.string().min(1).max(255).optional(),
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until `accessToken` expires, so the client can refresh proactively. */
  expiresIn: number;
}

export const publicUserSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  avatarUrl: z.url().nullable(),
  ratingAvg: z.number().nullable(),
  ratingCount: z.number().int(),
  createdAt: z.iso.datetime(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const currentUserSchema = publicUserSchema.extend({
  email: z.string(),
  schoolId: z.uuid(),
  schoolName: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export interface AuthSession extends AuthTokens {
  user: CurrentUser;
}

/** Claims we put in the access token. Keep it small: it travels on every request. */
export interface AccessTokenClaims {
  sub: string;
  schoolId: string;
  role: (typeof USER_ROLES)[number];
  /** Token family id, so refreshing can revoke a whole device session. */
  sid: string;
}
