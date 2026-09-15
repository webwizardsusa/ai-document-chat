import { Suspense, type ComponentType } from 'react';
import { Spinner } from '../feedback';

const Loadable =
  <P extends object>(Component: ComponentType<P>) =>
  (props: P) => (
    <Suspense fallback={<Spinner />}>
      <Component {...props} />
    </Suspense>
  );

export default Loadable;
