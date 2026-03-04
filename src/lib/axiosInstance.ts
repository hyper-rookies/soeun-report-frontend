import axios from 'axios';
import { getAccessToken, clearAccessToken } from './auth';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/auth'
    ) {
      clearAccessToken();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
