/** Single-flight access-token refresh shared by RTK Query and authedFetch. */

import { store } from '@/app/store';
import { setCredentials } from '@/features/auth/slices/authSlice';
import { broadcastCredentials, withRefreshLock } from '@/features/auth/authSync';
import type { LoginResponse } from '@/features/auth/types/auth';

type ApiEnvelope<T = unknown> = {
  status: boolean;
  message: string;
  result: T;
};

const refreshUrl = () =>
  `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`;

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token once (cross-tab lock + in-process single-flight).
 * Returns the new access token, or null on failure.
 */
export const refreshSession = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = withRefreshLock(async () => {
      const res = await fetch(refreshUrl(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      if (!res.ok) return null;

      const body = (await res.json()) as ApiEnvelope<LoginResponse>;
      if (!body.status || !body.result?.access_token) return null;

      store.dispatch(setCredentials(body.result));
      broadcastCredentials(body.result);
      return body.result.access_token;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};
