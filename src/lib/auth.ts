const TOKEN_KEY = 'accessToken';

export const getAccessToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  // middleware는 localStorage 접근 불가 → 쿠키에도 동기화 (7일)
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
};

export const isLoggedIn = (): boolean => !!getAccessToken();
