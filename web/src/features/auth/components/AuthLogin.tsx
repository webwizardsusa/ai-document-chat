import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useLocation, useNavigate } from 'react-router';
import { useAppDispatch } from '@/app/store';
import { CustomFormLabel, CustomTextField } from '@/shared/components';
import { useLoginMutation } from '../api/authApi';
import { loginSchema, type LoginSchema } from '../schema/loginSchema';
import { setCredentials } from '../slices/authSlice';

type AuthLoginProps = {
  title?: string;
  subtext?: ReactNode;
};

const AuthLogin = ({ title, subtext }: AuthLoginProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error, reset }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (values: LoginSchema) => {
    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials(result));
      const fromQuery = new URLSearchParams(location.search).get('from');
      const fromState = (location.state as { from?: string } | null)?.from;
      const candidate = fromQuery || fromState || '/';
      const redirectTo =
        candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
      navigate(redirectTo, { replace: true });
    } catch {
      // error rendered from mutation state
    }
  };

  const apiError =
    error && typeof error === 'object' && 'data' in error ? String(error.data) : null;

  return (
    <>
      {title ? (
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      {apiError ? (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }} onClose={() => reset()}>
          {apiError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
