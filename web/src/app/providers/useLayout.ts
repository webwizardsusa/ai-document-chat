import { useContext } from 'react';
import { LayoutContext, type LayoutContextValue } from './layout-context';

export const useLayout = (): LayoutContextValue => {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return ctx;
};
