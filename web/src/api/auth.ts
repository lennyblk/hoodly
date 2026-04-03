import api from './axios';
import type { components } from './types.generated';

type SigninDto = components['schemas']['SigninDto'];
type SignupDto = components['schemas']['SignupDto'];
type AuthTokens = { access_token: string; refresh_token: string };

export const authApi = {
  signin: (payload: SigninDto) =>
    api.post<AuthTokens>('/auth/signin', payload),

  signup: (payload: SignupDto) =>
    api.post<AuthTokens>('/auth/signup', payload),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    api.post<AuthTokens>('/auth/refresh'),
};
