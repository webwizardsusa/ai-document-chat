import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useLocation, useNavigate } from 'react-router';
import { useAppDispatch } from '@/app/store';
import { useLoginMutation } from '../api/authApi';
import { loginSchema, type LoginSchema } from '../schema/loginSchema';
import { setCredentials } from '../slices/authSlice';

export const useAuthLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error, reset }] = useLoginMutation();

  const form = useForm<LoginSchema>({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(loginSchema),
  });

  const apiError =
    error && typeof error === 'object' && 'data' in error ? String(error.data) : null;

  const onSubmit = form.handleSubmit(async (values) => {
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
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    isLoading,
    apiError,
    clearError: reset,
  };
};
