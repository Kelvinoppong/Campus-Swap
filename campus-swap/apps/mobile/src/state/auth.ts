import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { AuthTokens, CurrentUser } from '@campus-swap/shared';

const ACCESS_TOKEN_KEY = 'campus-swap.accessToken';
const REFRESH_TOKEN_KEY = 'campus-swap.refreshToken';

interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  /** False until we have finished reading SecureStore on cold start. */
  ready: boolean;
  /** The address a code was just sent to, carried to the verify screen. */
  pendingEmail: string | null;
  restore: () => Promise<void>;
  setPendingEmail: (email: string | null) => void;
  signIn: (tokens: AuthTokens, user: CurrentUser) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Tokens live in the device keychain, never in AsyncStorage: a refresh token
 * is a long-lived credential. Only the access token is mirrored in memory so
 * the API client can read it synchronously.
 */
export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  ready: false,
  pendingEmail: null,

  restore: async () => {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    set({ accessToken, ready: true });
  },

  setPendingEmail: (email) => set({ pendingEmail: email }),

  signIn: async (tokens, user) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    set({ accessToken: tokens.accessToken, user, pendingEmail: null });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ accessToken: null, user: null, pendingEmail: null });
  },
}));

export async function readRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
