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

export const getUserNameFromToken = (): string => {
  const token = getAccessToken();
  if (!token) return '사용자';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const raw =
      payload.name ||
      payload['cognito:username'] ||
      payload.email?.split('@')[0] ||
      '사용자';
    // Cognito가 URL 인코딩된 이름을 반환하는 경우 디코딩
    try {
      return decodeURIComponent(escape(raw));
    } catch {
      return raw;
    }
  } catch {
    return '사용자';
  }
};
