const AUTH_BASE_URL = (import.meta.env.VITE_AUTH_BASE_URL || '').replace(/\/$/, '');
const GOOGLE_AUTH_BASE_URL = (import.meta.env.VITE_GOOGLE_AUTH_BASE_URL || '').replace(/\/$/, '');
const AUTH_BASE_URLS = Array.from(new Set([
  AUTH_BASE_URL.trim(),
  '', // Same-origin fallback for Vite/nginx proxy.
].filter((url) => url !== undefined && url !== null)));

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
  let lastError: unknown = null;

  for (const baseUrl of AUTH_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { message: (await response.text()).slice(0, 500) || `Request failed at ${baseUrl}${path}` };

      if (response.ok) return data;

      if (![404, 405].includes(response.status) && response.status < 500) {
        throw new Error(data?.message || 'Authentication failed. Please try again.');
      }

      lastError = new Error(data?.message || `Auth service unavailable at ${baseUrl}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Authentication service is unavailable.');
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
  const baseUrl = GOOGLE_AUTH_BASE_URL || AUTH_BASE_URL;
  return `${baseUrl}/oauth2/authorization/google`;
};
