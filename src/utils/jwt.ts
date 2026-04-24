interface JwtPayload {
  sub?: string;
}

export const extractEmailFromToken = (token: string): string | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    const payload = JSON.parse(jsonPayload) as JwtPayload;
    return payload.sub || null;
  } catch {
    return null;
  }
};
