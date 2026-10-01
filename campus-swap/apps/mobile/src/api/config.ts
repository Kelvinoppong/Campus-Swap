import { API_PREFIX } from '@campus-swap/shared';

/**
 * The simulator and the web build share the host's network, so localhost is
 * right for both. A physical device needs the Mac's LAN address instead, which
 * is what `EXPO_PUBLIC_API_URL` is for.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function apiUrl(path: string): string {
  return `${BASE_URL}/${API_PREFIX}${path}`;
}
