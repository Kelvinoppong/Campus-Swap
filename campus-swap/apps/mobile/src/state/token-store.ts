import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface TokenStore {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

/**
 * A refresh token is a long-lived credential, so on device it belongs in the
 * keychain. The browser has no keychain and `expo-secure-store` throws there,
 * so the web build falls back to localStorage. That is weaker storage, which
 * is acceptable because web is the public demo build, not the shipping app.
 */
const browserStore: TokenStore = {
  getItem: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key, value) => {
    globalThis.localStorage?.setItem(key, value);
  },
  deleteItem: async (key) => {
    globalThis.localStorage?.removeItem(key);
  },
};

const keychainStore: TokenStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

export const tokenStore: TokenStore =
  Platform.OS === 'web' ? browserStore : keychainStore;
