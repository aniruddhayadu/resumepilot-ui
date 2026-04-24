const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || '';

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

export const getGoogleLoginUrl = (): string =>
  `${AUTH_BASE_URL}/oauth2/authorization/google`;
