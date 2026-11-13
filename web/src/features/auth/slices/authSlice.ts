import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, LoginResponse } from '../types/auth';

export type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  initialized: boolean;
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      state.accessToken = action.payload.access_token;
      state.user = action.payload.user;
      state.initialized = true;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.initialized = true;
    },
  },
});

export const { setCredentials, setUser, setInitialized, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.accessToken && state.auth.user);
