import { Navigate, Outlet } from 'react-router';
import { Spinner } from '@/shared/components';
import { useGuestRoute, useProtectedRoute } from '../hooks';

/** Redirects authenticated users away from guest-only routes (e.g. login). */
export const GuestRoute = () => {
  const { initialized, isAuthenticated } = useGuestRoute();

  if (!initialized) {
    return <Spinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const ProtectedRoute = () => {
  const { initialized, isAuthenticated, fromPath } = useProtectedRoute();

  if (!initialized) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: fromPath }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
