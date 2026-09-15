import { useEffect, type ReactNode } from 'react';
import { Spinner } from '@/shared/components';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { authApi } from '../api/authApi';
import {
  logout,
  selectAuthInitialized,
  setCredentials,
  setInitialized,
} from '../slices/authSlice';

type Props = {
  children: ReactNode;
};

/**
 * Restores session from HttpOnly refresh cookie on app start.
 * Access token lives in Redux memory only.
 */
const AuthBootstrap = ({ children }: Props) => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    let cancelled = false;
    // Migrate away from any legacy localStorage auth payload.
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

  if (!initialized) {
    return <Spinner />;
  }

  return children;
};

export default AuthBootstrap;
