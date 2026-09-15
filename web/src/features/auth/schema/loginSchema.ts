import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export type LoginSchema = yup.InferType<typeof loginSchema>;
