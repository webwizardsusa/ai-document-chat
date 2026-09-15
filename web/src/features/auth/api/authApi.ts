import { baseApi } from '@/app/api/baseApi';
import type { LoginRequest, LoginResponse } from '../types/auth';
import { setUser } from '../slices/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    refresh: build.mutation<LoginResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
        body: {},
      }),
    }),
    logout: build.mutation<null, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        body: {},
      }),
    }),
    me: build.query<LoginResponse['user'], void>({
      query: () => '/auth/me',
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // leave existing user state; 401 handling clears session
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
} = authApi;
