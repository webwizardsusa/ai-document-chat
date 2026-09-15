import { useThemeSettings } from '@/app/theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router';
import { ToastContainer } from 'react-toastify';
import { router } from '@/app/navigation';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const theme = useThemeSettings();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        style={{ zIndex: 20000 }}
      />
    </ThemeProvider>
  );
}

export default App;
