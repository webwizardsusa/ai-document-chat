export type AuthUser = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type?: string;
  user: AuthUser;
};
