import { Grid, Box, Typography } from '@mui/material';
import { PageContainer, Logo } from '@/shared/components';
import { loginBg } from '@/shared/assets';
import AuthLogin from '@/features/auth/components/AuthLogin';

const Login = () => (
  <PageContainer title="Login" description="AI Document Chat login">
    <Grid container spacing={0} sx={{ overflowX: 'hidden' }}>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          lg: 7,
          xl: 8,
        }}
        sx={{
          position: 'relative',
          '&:before': {
            content: '""',
            background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
            backgroundSize: '400% 400%',
            animation: 'gradient 15s ease infinite',
            position: 'absolute',
            height: '100%',
            width: '100%',
            opacity: '0.3',
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ px: 3 }}>
            <Logo />
          </Box>
          <Box
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100vh - 75px)',
              display: {
                xs: 'none',
                lg: 'flex',
              },
            }}
          >
            <img
              src={loginBg}
              alt=""
              style={{
                width: '100%',
                maxWidth: '500px',
              }}
            />
          </Box>
        </Box>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          lg: 5,
          xl: 4,
        }}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ p: 4 }}>
          <AuthLogin
            title="Welcome to AI Document Chat"
            subtext={
              <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 1 }}>
                Sign in to ask questions across your documents
              </Typography>
            }
          />
        </Box>
      </Grid>
    </Grid>
  </PageContainer>
);

export default Login;
