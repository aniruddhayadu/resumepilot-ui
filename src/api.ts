// src/api.ts

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8081';

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
  token: string;
  fullName?: string;
  role?: string;     
  message?: string;
}

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed. Please try again.');
  }

  return data;
};

export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed. Please try again.');
  }

  return data;
};

export const forgotPassword = async (email: string): Promise<string> => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.text(); // Backend se String return ho raha hai

  if (!response.ok) {
    throw new Error(data || 'Failed to send reset link.');
  }

  return data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.text();

  if (!response.ok) {
    throw new Error(data || 'Failed to reset password.');
  }

  return data;
};

export const getGoogleLoginUrl = (): string =>
  `${AUTH_BASE_URL}/oauth2/authorization/google`;