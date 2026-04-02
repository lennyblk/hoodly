import api from './axios';

export interface SigninPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  lang?: 'fr' | 'en';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export const authApi = {
  signin: (payload: SigninPayload) =>
    api.post<AuthTokens>('/auth/signin', payload),

  signup: (payload: SignupPayload) =>
    api.post<AuthTokens>('/auth/signup', payload),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    api.post<AuthTokens>('/auth/refresh'),
};
