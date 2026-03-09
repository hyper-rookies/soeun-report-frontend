import axios from 'axios';
import { getAccessToken, clearTokens, refreshTokenOnce } from './auth';

const axiosInstance = axios.create({
  baseURL: '',
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/auth/login'
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshTokenOnce();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        clearTokens();
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
