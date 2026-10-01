import type {
  AuthSession,
  CurrentUser,
  RequestCodeResponse,
} from '@campus-swap/shared';

import { apiRequest } from './client';

/** Sends a one-time code. The API answers the same way whether or not the
 *  address already has an account, so this never reveals who is registered. */
export function requestSignInCode(email: string): Promise<RequestCodeResponse> {
  return apiRequest<RequestCodeResponse>('/auth/request-code', {
    method: 'POST',
    body: { email },
    anonymous: true,
  });
}

export function verifySignInCode(email: string, code: string): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/verify-code', {
    method: 'POST',
    body: { email, code },
    anonymous: true,
  });
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me');
}
