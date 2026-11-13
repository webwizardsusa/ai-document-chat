/** Authenticated fetch with one refresh retry (blob / SSE outside RTK Query). */

import { store } from '@/app/store';
import { logout } from '@/features/auth/slices/authSlice';
import { refreshSession } from '@/features/auth/refreshSession';

export const apiBaseUrl = () => import.meta.env.VITE_API_URL || '/api/v1';

export const authedFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const url = path.startsWith('http') ? path : `${apiBaseUrl()}${path}`;

  const doFetch = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    return fetch(url, { ...init, headers, credentials: 'include' });
  };

  let token = store.getState().auth.accessToken;
  let response = await doFetch(token);

  if (response.status === 401) {
    token = await refreshSession();
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
