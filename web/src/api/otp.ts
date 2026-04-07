import api from './axios';

export const otpApi = {
  send: (email: string, firstName?: string) =>
    api.post('/auth/otp/send', { email, firstName }),

  verify: (email: string, code: string) =>
    api.post<{ otpToken: string }>('/auth/otp/verify', { email, code }),
};
