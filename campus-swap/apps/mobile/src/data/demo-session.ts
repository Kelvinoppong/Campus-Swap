import type { AuthTokens, CurrentUser } from '@campus-swap/shared';

/**
 * Stand-in for POST /v1/auth/verify-code until the API lands in the next pass.
 * It exists so the sign-in screens, the auth store and the keychain path are
 * all exercised on a real phone now; deleting this file is the only change the
 * screens need once the endpoint is live.
 */
export function demoSession(email: string): { tokens: AuthTokens; user: CurrentUser } {
  const localPart = email.split('@')[0] ?? 'student';
  const displayName = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    tokens: {
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token',
      expiresIn: 900,
    },
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      email,
      schoolId: '00000000-0000-4000-8000-0000000000aa',
      schoolName: email.split('@')[1] ?? 'yourschool.edu',
      displayName: displayName || 'Student',
      avatarUrl: null,
      role: 'student',
      status: 'active',
      ratingAvg: 4.9,
      ratingCount: 12,
      createdAt: new Date().toISOString(),
    },
  };
}
