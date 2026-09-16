import { useLayoutEffect, useState } from 'react';
import TopLoadingBar from 'react-top-loading-bar';
import { useLocation } from 'react-router';
import { useTheme } from '@mui/material/styles';

const LoadingBar = () => {
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const theme = useTheme();

  useLayoutEffect(() => {
    const startTimer = window.setTimeout(() => setProgress(40), 0);
    const finishTimer = window.setTimeout(() => setProgress(100), 180);
    const resetTimer = window.setTimeout(() => setProgress(0), 420);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(resetTimer);
    };
  }, [location.key]);

  return <TopLoadingBar color={theme.palette.primary.main} height={3} progress={progress} />;
};

export default LoadingBar;
