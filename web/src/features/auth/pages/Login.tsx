import { Grid, Box, Typography } from '@mui/material';
import { PageContainer } from '@/shared/components';
import { loginBg } from '@/shared/assets';
import AuthLogin from '@/features/auth/components/AuthLogin';

const Login = () => (
  <PageContainer title="Login" description="AI Document Chat login">
    <Grid
      container
      spacing={0}
      sx={{
        width: '100%',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Grid
        size={{
          xs: 0,
          lg: 7,
          xl: 8,
        }}
        sx={{
          display: { xs: 'none', lg: 'block' },
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={loginBg}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          lg: 5,
          xl: 4,
        }}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 4, width: '100%', maxWidth: 420 }}>
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
