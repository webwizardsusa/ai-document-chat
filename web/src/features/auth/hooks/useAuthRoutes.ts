import { useLocation } from 'react-router';
import { useAppSelector } from '@/app/store';
import { useMeQuery } from '../api/authApi';
import {
  selectAuthInitialized,
  selectIsAuthenticated,
} from '../slices/authSlice';

export const useGuestRoute = () => {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return { initialized, isAuthenticated };
};

export const useProtectedRoute = () => {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  useMeQuery(undefined, { skip: !isAuthenticated });

  return {
    initialized,
    isAuthenticated,
    fromPath: location.pathname,
  };
};
