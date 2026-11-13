import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { refreshSession } from '@/features/auth/refreshSession';
import { logout } from '@/features/auth/slices/authSlice';

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
    const token = await refreshSession();

    if (token) {
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
