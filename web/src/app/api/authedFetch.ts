/** Authenticated fetch with one refresh retry (blob / SSE outside RTK Query). */

import { store } from '@/app/store';
import { logout, setCredentials } from '@/features/auth/slices/authSlice';
import { broadcastCredentials } from '@/features/auth/authSync';
import type { LoginResponse } from '@/features/auth/types/auth';

export const apiBaseUrl = () => import.meta.env.VITE_API_URL || '/api/v1';

const apiBase = apiBaseUrl;

type ApiEnvelope<T = unknown> = {
  status: boolean;
  message: string;
  result: T;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const res = await fetch(`${apiBase()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) return null;
  const body = (await res.json()) as ApiEnvelope<LoginResponse>;
  if (!body.status || !body.result?.access_token) return null;
  store.dispatch(setCredentials(body.result));
  broadcastCredentials(body.result);
  return body.result.access_token;
};

export const authedFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const url = path.startsWith('http') ? path : `${apiBase()}${path}`;

  const doFetch = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    return fetch(url, { ...init, headers, credentials: 'include' });
  };

  let token = store.getState().auth.accessToken;
  let response = await doFetch(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (!token) {
      store.dispatch(logout());
      return response;
    }
    response = await doFetch(token);
    if (response.status === 401) {
      store.dispatch(logout());
    }
  }

  return response;
};
