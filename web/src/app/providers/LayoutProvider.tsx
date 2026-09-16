import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { layoutConfig, type SidebarCollapse } from './config';
import { LayoutContext } from './layout-context';

type Props = {
  children: ReactNode;
};

export const LayoutProvider = ({ children }: Props) => {
  const [isCollapse, setIsCollapse] = useState<SidebarCollapse>('full-sidebar');
  const [isSidebarHover, setIsSidebarHover] = useState(false);
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);
  const [isDocsSidebar, setIsDocsSidebar] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('class', 'light');
    document.documentElement.setAttribute('dir', layoutConfig.direction);
    document.documentElement.setAttribute('data-layout', 'vertical');
    document.documentElement.setAttribute('data-sidebar-type', isCollapse);
  }, [isCollapse]);

  const value = useMemo(
    () => ({
      isCollapse,
      setIsCollapse,
      isSidebarHover,
      setIsSidebarHover,
      isMobileSidebar,
      setIsMobileSidebar,
      isDocsSidebar,
      setIsDocsSidebar,
    }),
    [isCollapse, isSidebarHover, isMobileSidebar, isDocsSidebar],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
