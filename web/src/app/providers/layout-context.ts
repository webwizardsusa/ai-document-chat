import { createContext } from 'react';

export type LayoutContextValue = {
  isMobileSidebar: boolean;
  setIsMobileSidebar: (isMobileSidebar: boolean) => void;
  isDocsSidebar: boolean;
  setIsDocsSidebar: (isDocsSidebar: boolean) => void;
};

export const LayoutContext = createContext<LayoutContextValue | null>(null);
