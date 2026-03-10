import { getAccessToken, clearTokens, refreshTokenOnce } from './auth';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    try {
      const newToken = await refreshTokenOnce();
      res = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    } catch {
      clearTokens();
      window.location.href = '/auth';
    }
  }

  return res;
}
