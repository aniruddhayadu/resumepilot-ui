import api, { API_BASE_URL } from './api/api';

const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  token?: string;
  fullName?: string;
  role?: string;     
  message?: string;
}

const normalizeToken = (data: any): string => {
  const rawToken = data?.token || data?.accessToken || data?.jwt || data?.tokenValue || '';
  const cleanedToken = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '').trim() : '';
  if (!cleanedToken) {
    throw new Error(data?.message || 'Authentication failed. No token was returned by the server.');
  }
  return cleanedToken;
};

const normalizeAuthResponse = (data: any): AuthResponse => ({
  ...data,
  token: normalizeToken(data),
});

const requestJson = async (path: string, payload: unknown): Promise<any> => {
  try {
    const response = await api.post(path, payload);
    return response.data;
  } catch (error) {
    const data = (error as any)?.response?.data;
    throw new Error(data?.message || data?.error || (error as any)?.message || 'Authentication service is unavailable.');
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<string> => {
  const data = await requestJson('/auth/verify-otp', { email, otp });
  return typeof data === 'string' ? data : data?.message || 'Verification successful.';
};

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  return normalizeAuthResponse(await requestJson('/auth/login', payload));
};

export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  return await requestJson('/auth/register', payload);
};

export const forgotPassword = async (email: string): Promise<string> => {
  const data = await requestJson('/auth/forgot-password', { email });
  return typeof data === 'string' ? data : data?.message || 'Reset link sent.';
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  const data = await requestJson('/auth/reset-password', { token, newPassword });
  return typeof data === 'string' ? data : data?.message || 'Password reset successful.';
};

export const getGoogleLoginUrl = (): string => {
  return GOOGLE_AUTH_URL;
};
