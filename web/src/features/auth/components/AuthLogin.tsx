import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { CustomFormLabel, CustomTextField } from '@/shared/components';
import { useAuthLogin } from '../hooks';

type AuthLoginProps = {
  title?: string;
  subtext?: ReactNode;
};

const AuthLogin = ({ title, subtext }: AuthLoginProps) => {
  const { register, errors, onSubmit, isLoading, apiError, clearError } = useAuthLogin();

  return (
    <>
      {title ? (
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      {apiError ? (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }} onClose={clearError}>
          {apiError}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <Stack sx={{ mb: 2, mt: apiError || title ? 0 : 2 }}>
          <Box>
            <CustomFormLabel htmlFor="email">Email</CustomFormLabel>
            <CustomTextField
              id="email"
              type="email"
              variant="outlined"
              fullWidth
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
          </Box>
          <Box>
            <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
            <CustomTextField
              id="password"
              type="password"
              variant="outlined"
              fullWidth
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />
          </Box>
        </Stack>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
