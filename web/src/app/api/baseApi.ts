import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import {
  broadcastCredentials,
  withRefreshLock,
} from '@/features/auth/authSync';
import { logout, setCredentials } from '@/features/auth/slices/authSlice';
import type { LoginResponse } from '@/features/auth/types/auth';

export const API_TAGS = {
  Auth: 'Auth',
  Workspace: 'Workspace',
  Document: 'Document',
  Message: 'Message',
} as const;

type ApiEnvelope<T = unknown> = {
  status: boolean;
  message: string;
  result: T;
  errors?: unknown;
};

type AuthRootState = {
  auth: {
    accessToken: string | null;
  };
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthRootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const resolveErrorMessage = (data: unknown): string => {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const envelope = data as ApiEnvelope;
    if (typeof envelope.message === 'string' && envelope.message.trim()) {
      return envelope.message;
    }
  }

  return 'Request failed';
};

const unwrapEnvelope = <T>(data: unknown): T | undefined => {
  if (data && typeof data === 'object' && 'status' in data) {
    const envelope = data as ApiEnvelope<T>;
    if (!envelope.status) {
      return undefined;
    }
    return envelope.result;
  }
  return data as T | undefined;
};

let refreshPromise: Promise<LoginResponse | null> | null = null;

const refreshAccessToken: BaseQueryFn<
  void,
  LoginResponse | null,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (_args, api, extraOptions) => {
  if (!refreshPromise) {
    refreshPromise = withRefreshLock(async () => {
      // Another tab may have refreshed while we waited for the lock.
      const existing = (api.getState() as AuthRootState).auth.accessToken;
      if (existing) {
        // Re-check by attempting nothing — caller retries original request.
        // Still run refresh if we got here from 401; cookie may be rotated.
      }

      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: {} },
        api,
        extraOptions,
      );

      if (refreshResult.error) {
        return null;
      }

      const payload = unwrapEnvelope<LoginResponse>(refreshResult.data);
      if (!payload?.access_token) {
        return null;
      }

      api.dispatch(setCredentials(payload));
      broadcastCredentials(payload);
      return payload;
    }).finally(() => {
      refreshPromise = null;
    });
  }

  const payload = await refreshPromise;
  if (!payload) {
    return { error: { status: 401, data: 'Session expired' } as FetchBaseQueryError };
  }
  return { data: payload };
};

const isAuthBootstrapUrl = (url: string) =>
  url.includes('/auth/login') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/register');

const baseQueryWithEnvelope: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 401 && !isAuthBootstrapUrl(url)) {
    const refreshResult = await refreshAccessToken(undefined, api, extraOptions);

    if (refreshResult.data) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      return {
        error: {
          status: 401,
          data: 'Session expired',
        } as FetchBaseQueryError,
      };
    }
  }

  if (result.error) {
    if (result.error.status === 401 && !isAuthBootstrapUrl(url)) {
      api.dispatch(logout());
    }

    return {
      error: {
        status: result.error.status,
        data: resolveErrorMessage(result.error.data),
      } as FetchBaseQueryError,
    };
  }

  const body = result.data as ApiEnvelope | undefined;
  if (body && typeof body === 'object' && 'status' in body) {
    if (!body.status) {
      return {
        error: {
          status: 400,
          data: resolveErrorMessage(body),
        } as FetchBaseQueryError,
      };
    }

    return { data: body.result };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithEnvelope,
  tagTypes: Object.values(API_TAGS),
  endpoints: () => ({}),
});
