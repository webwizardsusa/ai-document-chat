import { Outlet } from 'react-router';
import LoadingBar from '../full/LoadingBar';

const BlankLayout = () => (
  <>
    <LoadingBar />
    <Outlet />
  </>
);

export default BlankLayout;
