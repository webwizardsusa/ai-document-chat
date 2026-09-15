import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { PageContainer, Logo } from '@/shared/components';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { useLogoutMutation } from '@/features/auth/api/authApi';
import { logout, selectAuthUser } from '@/features/auth/slices/authSlice';

const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);
  const [logoutRequest, { isLoading }] = useLogoutMutation();

  const onLogout = async () => {
    try {
      await logoutRequest().unwrap();
    } catch {
      // clear local session even if API logout fails
    } finally {
      dispatch(logout());
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <PageContainer title="Home" description="Signed in">
      <Box sx={{ p: 3 }}>
        <Logo />
        <Stack spacing={2} sx={{ mt: 4, maxWidth: 420 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Signed in
          </Typography>
          <Typography color="textSecondary">
            Welcome back{user?.name ? `, ${user.name}` : ''}.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={onLogout}
            disabled={isLoading}
            sx={{ alignSelf: 'flex-start' }}
          >
            {isLoading ? 'Signing out...' : 'Sign out'}
          </Button>
        </Stack>
      </Box>
    </PageContainer>
  );
};

export default HomePage;
