export const storageKeys = {
  token: 'token',
  userName: 'userName',
  userEmail: 'userEmail',
} as const;

export const getToken = (): string | null => localStorage.getItem(storageKeys.token);

export const getUserName = (): string => localStorage.getItem(storageKeys.userName) || 'User';

export const getUserEmail = (): string =>
  localStorage.getItem(storageKeys.userEmail) || 'testuser@capgemini.com';

export const setAuthSession = (token: string, userEmail: string, userName?: string): void => {
  localStorage.setItem(storageKeys.token, token);
  localStorage.setItem(storageKeys.userEmail, userEmail);

  if (userName) {
    localStorage.setItem(storageKeys.userName, userName);
  }
};

export const clearSession = (): void => {
  localStorage.clear();
};
