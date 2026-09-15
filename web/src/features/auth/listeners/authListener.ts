import { createListenerMiddleware } from '@reduxjs/toolkit';
import { baseApi } from '@/app/api/baseApi';
import { logout } from '@/features/auth/slices/authSlice';

/**
 * Whenever auth is cleared, drop all RTK Query cache so the next
 * user never sees the previous user's workspace/document data.
 */
export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState());
  },
});
