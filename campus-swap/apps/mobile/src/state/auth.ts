import { create } from 'zustand';

import type { AuthSession, AuthTokens, CurrentUser } from '@campus-swap/shared';

import { apiUrl } from '@/api/config';

import { tokenStore } from './token-store';

const ACCESS_TOKEN_KEY = 'campus-swap.accessToken';
const REFRESH_TOKEN_KEY = 'campus-swap.refreshToken';

interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  /** False until we have finished reading stored tokens on cold start. */
  ready: boolean;
  /** The address a code was just sent to, carried to the verify screen. */
  pendingEmail: string | null;
  restore: () => Promise<void>;
  setPendingEmail: (email: string | null) => void;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
  /** Rotates the refresh token. Returns the new access token, or null if the
   *  session is gone and the user has to sign in again. */
  refreshSession: () => Promise<string | null>;
}

async function persist(tokens: AuthTokens): Promise<void> {
  await tokenStore.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  await tokenStore.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

async function clearStoredTokens(): Promise<void> {
  await tokenStore.deleteItem(ACCESS_TOKEN_KEY);
  await tokenStore.deleteItem(REFRESH_TOKEN_KEY);
}

/**
 * Tokens go through `tokenStore`, which is the device keychain on iOS and
 * Android. Only the access token is mirrored in memory, so the API client can
 * read it synchronously.
 */
export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  ready: false,
  pendingEmail: null,

  restore: async () => {
    try {
      const accessToken = await tokenStore.getItem(ACCESS_TOKEN_KEY);
      set({ accessToken, ready: true });
    } catch {
      // A storage read must never strand the app on a blank screen; the worst
      // case is that the user signs in again.
      set({ accessToken: null, ready: true });
    }
  },

  setPendingEmail: (email) => set({ pendingEmail: email }),

  signIn: async (session) => {
    await persist(session);
    set({ accessToken: session.accessToken, user: session.user, pendingEmail: null });
  },

  signOut: async () => {
    // Tell the API first, so the refresh token is revoked server-side rather
    // than just forgotten on this device.
    const refreshToken = await tokenStore.getItem(REFRESH_TOKEN_KEY).catch(() => null);
    if (refreshToken) {
      await fetch(apiUrl('/auth/sign-out'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }

    await clearStoredTokens();
    set({ accessToken: null, user: null, pendingEmail: null });
  },

  /**
   * Deliberately a bare `fetch` rather than the API client: this is the one
   * call that must not be retried through the refresh path, or a failure would
   * recurse.
   */
  refreshSession: async () => {
    const refreshToken = await tokenStore.getItem(REFRESH_TOKEN_KEY).catch(() => null);
    if (!refreshToken) return null;

    let response: Response;
    try {
      response = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Offline. Keep the session so it still works once the network returns.
      return null;
    }

    if (!response.ok) {
      // The API rejected the token, which also happens when reuse was detected
      // and the whole family was already revoked. Clear local state to match,
      // without calling sign-out: the server has nothing left to revoke.
      await clearStoredTokens();
      set({ accessToken: null, user: null, pendingEmail: null });
      return null;
    }

    const tokens = (await response.json()) as AuthTokens;
    await persist(tokens);
    set({ accessToken: tokens.accessToken });
    return tokens.accessToken;
  },
}));

export async function readRefreshToken(): Promise<string | null> {
  return tokenStore.getItem(REFRESH_TOKEN_KEY);
}
