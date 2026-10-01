import { useAuth } from '@/state/auth';

import { apiUrl } from './config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when retrying the same request might succeed. */
  get isTransient(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skips the access token and the refresh dance, for sign-in endpoints. */
  anonymous?: boolean;
}

/**
 * Nest returns `{ statusCode, message }`, where `message` is a string for most
 * failures but an array of strings for validation errors.
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const { message } = payload as { message: unknown };
      if (Array.isArray(message)) return message.join('\n');
      if (typeof message === 'string') return message;
    }
  } catch {
    // Not JSON; fall through to the generic message below.
  }
  return response.status >= 500
    ? 'Something went wrong on our end. Try again.'
    : 'That request could not be completed.';
}

/**
 * A single in-flight refresh shared by every caller. Without this, a screen
 * that fires several requests at once would rotate the refresh token several
 * times in parallel, and the API would read the second rotation as a replayed
 * token and sign the user out of every device.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      return await useAuth.getState().refreshSession();
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function send(path: string, options: RequestOptions, accessToken: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(apiUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken } = useAuth.getState();

  let response: Response;
  try {
    response = await send(path, options, options.anonymous ? null : accessToken);
  } catch {
    // fetch only rejects when the request never reached the server.
    throw new ApiError(0, 'Cannot reach Campus Swap. Check your connection.');
  }

  // One retry, and only after a refresh actually produced a new token.
  if (response.status === 401 && !options.anonymous) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      try {
        response = await send(path, options, renewed);
      } catch {
        throw new ApiError(0, 'Cannot reach Campus Swap. Check your connection.');
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
