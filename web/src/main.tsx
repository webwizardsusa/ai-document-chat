import { Suspense } from 'react';
import { Provider } from 'react-redux';
import App from '@/app/App';
import { LayoutProvider } from '@/app/providers';
import { store } from '@/app/store';
import AuthBootstrap from '@/features/auth/components/AuthBootstrap';
import { ErrorBoundary, Spinner } from '@/shared/components';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <LayoutProvider>
      <ErrorBoundary>
        <AuthBootstrap>
          <Suspense fallback={<Spinner />}>
            <App />
          </Suspense>
        </AuthBootstrap>
      </ErrorBoundary>
    </LayoutProvider>
  </Provider>,
);
