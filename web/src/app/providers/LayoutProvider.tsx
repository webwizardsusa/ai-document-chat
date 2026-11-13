import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { layoutConfig } from './config';
import { LayoutContext } from './layout-context';

type Props = {
  children: ReactNode;
};

export const LayoutProvider = ({ children }: Props) => {
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);
  const [isDocsSidebar, setIsDocsSidebar] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('class', 'light');
    document.documentElement.setAttribute('dir', layoutConfig.direction);
    document.documentElement.setAttribute('data-layout', 'vertical');
    document.documentElement.setAttribute('data-sidebar-type', 'full-sidebar');
  }, []);

  const value = useMemo(
    () => ({
      isMobileSidebar,
      setIsMobileSidebar,
      isDocsSidebar,
      setIsDocsSidebar,
    }),
    [isMobileSidebar, isDocsSidebar],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
