import type { ReactNode } from 'react';
import { Spinner } from '@/shared/components';
import { useAuthBootstrap } from '../hooks';

type Props = {
  children: ReactNode;
};

/** Restores session from HttpOnly refresh cookie on app start. */
const AuthBootstrap = ({ children }: Props) => {
  const { initialized } = useAuthBootstrap();

  if (!initialized) {
    return <Spinner />;
  }

  return children;
};

export default AuthBootstrap;
