interface JwtPayload {
  sub?: string;
  role?: string;
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

export const extractEmailFromToken = (token: string): string | null => {
  return decodeJwtPayload(token)?.sub || null;
};

export const extractRoleFromToken = (token: string): string | null => {
  const role = decodeJwtPayload(token)?.role;
  return role ? role.toUpperCase() : null;
};
