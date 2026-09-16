import { createContext } from 'react';
import type { SidebarCollapse } from './config';

export type LayoutContextValue = {
  isCollapse: SidebarCollapse;
  setIsCollapse: (collapse: SidebarCollapse) => void;
  isSidebarHover: boolean;
  setIsSidebarHover: (isHover: boolean) => void;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (isMobileSidebar: boolean) => void;
  isDocsSidebar: boolean;
  setIsDocsSidebar: (isDocsSidebar: boolean) => void;
};

export const LayoutContext = createContext<LayoutContextValue | null>(null);
