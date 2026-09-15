import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/shared/components';
import { useAppSelector } from '@/app/store';
import { useMeQuery } from '../api/authApi';
import {
  selectAuthInitialized,
  selectIsAuthenticated,
} from '../slices/authSlice';

/** Redirects authenticated users away from guest-only routes (e.g. login). */
export const GuestRoute = () => {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!initialized) {
    return <Spinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const ProtectedRoute = () => {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  useMeQuery(undefined, { skip: !isAuthenticated });

  if (!initialized) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
