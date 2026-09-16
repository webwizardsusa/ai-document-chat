import type { Store } from '@reduxjs/toolkit';
import { logout, setCredentials } from '@/features/auth/slices/authSlice';
import type { LoginResponse } from '@/features/auth/types/auth';

const CHANNEL_NAME = 'ai-document-auth';
const REFRESH_LOCK_NAME = 'ai-document-auth-refresh';

type AuthMessage =
  | { type: 'credentials'; payload: LoginResponse }
  | { type: 'logout' };

let channel: BroadcastChannel | null = null;
/** Suppress re-broadcast when applying a remote logout. */
let applyingRemoteLogout = false;

export const initAuthSync = (store: Store) => {
  if (typeof BroadcastChannel === 'undefined') return;
  if (channel) return;

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<AuthMessage>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    if (message.type === 'logout') {
      applyingRemoteLogout = true;
      try {
        store.dispatch(logout());
      } finally {
        applyingRemoteLogout = false;
      }
      return;
    }

    if (message.type === 'credentials' && message.payload?.access_token) {
      store.dispatch(setCredentials(message.payload));
    }
  };
};

export const broadcastCredentials = (payload: LoginResponse) => {
  channel?.postMessage({ type: 'credentials', payload } satisfies AuthMessage);
};

export const broadcastLogout = () => {
  if (applyingRemoteLogout) return;
  channel?.postMessage({ type: 'logout' } satisfies AuthMessage);
};

/** Cross-tab single-flight lock when Web Locks API is available. */
export const withRefreshLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks?.request) {
    return fn();
  }
  return locks.request(REFRESH_LOCK_NAME, fn);
};
