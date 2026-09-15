import { lazy, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Loadable } from '@/shared/components';
import ProtectedRoute, { GuestRoute } from '@/features/auth/components/ProtectedRoute';

const lazyPage = (loader: () => Promise<{ default: ComponentType }>) => Loadable(lazy(loader));

const BlankLayout = lazyPage(() => import('@/app/layouts/blank/BlankLayout'));
const Login = lazyPage(() => import('@/features/auth/pages/Login'));
const Error = lazyPage(() => import('@/features/auth/pages/Error'));
const HomePage = lazyPage(() => import('@/features/home/pages/HomePage'));

const routes = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <BlankLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [{ path: 'login', element: <Login /> }],
      },
      { path: '404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" replace /> },
    ],
  },
];

const router = createBrowserRouter(routes);
export default router;
