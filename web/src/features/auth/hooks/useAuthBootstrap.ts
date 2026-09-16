import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { authApi } from '../api/authApi';
import {
  logout,
  selectAuthInitialized,
  setCredentials,
  setInitialized,
} from '../slices/authSlice';

/** Restores session from HttpOnly refresh cookie on app start. */
export const useAuthBootstrap = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    let cancelled = false;
    localStorage.removeItem('ai_document_auth');

    const restore = async () => {
      try {
        const result = await dispatch(authApi.endpoints.refresh.initiate()).unwrap();
        if (!cancelled) {
          dispatch(setCredentials(result));
        }
      } catch {
        if (!cancelled) {
          dispatch(logout());
        }
      } finally {
        if (!cancelled) {
          dispatch(setInitialized(true));
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return { initialized };
};
