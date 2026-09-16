import { createListenerMiddleware } from '@reduxjs/toolkit';
import { baseApi } from '@/app/api/baseApi';
import { broadcastLogout } from '@/features/auth/authSync';
import { logout } from '@/features/auth/slices/authSlice';
import { setActiveWorkspaceId } from '@/features/workspace/slices/workspaceSlice';

/**
 * Whenever auth is cleared, drop RTK Query cache and workspace UI so the next
 * user never sees the previous user's data. Broadcast logout to other tabs.
 */
export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(setActiveWorkspaceId(null));
    listenerApi.dispatch(baseApi.util.resetApiState());
    broadcastLogout();
  },
});
