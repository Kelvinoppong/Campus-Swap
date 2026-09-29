import { create } from 'zustand';

import type { AuthTokens, CurrentUser } from '@campus-swap/shared';

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
  signIn: (tokens: AuthTokens, user: CurrentUser) => Promise<void>;
  signOut: () => Promise<void>;
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

  signIn: async (tokens, user) => {
    await tokenStore.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    await tokenStore.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    set({ accessToken: tokens.accessToken, user, pendingEmail: null });
  },

  signOut: async () => {
    await tokenStore.deleteItem(ACCESS_TOKEN_KEY);
    await tokenStore.deleteItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, user: null, pendingEmail: null });
  },
}));

export async function readRefreshToken(): Promise<string | null> {
  return tokenStore.getItem(REFRESH_TOKEN_KEY);
}
