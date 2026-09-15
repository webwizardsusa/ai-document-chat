import { useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import { layoutConfig } from '@/app/providers';
import components from './components';
import { lightTheme } from './colors';
import { shadows } from './shadows';
import typography from './typography';

export const useThemeSettings = () => {
  useEffect(() => {
    document.dir = layoutConfig.direction;
  }, []);

  return useMemo(() => {
    const theme = createTheme({
      direction: layoutConfig.direction,
      palette: {
        mode: 'light',
        ...lightTheme.palette,
      },
      shape: {
        borderRadius: layoutConfig.borderRadius,
      },
      shadows,
      typography,
    });
    theme.components = components(theme) as typeof theme.components;
    return theme;
  }, []);
};
