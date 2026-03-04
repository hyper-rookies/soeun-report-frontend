import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/utils/constants';
import { ApiError } from '@/types';
import { getAccessToken, clearAccessToken } from '@/lib/auth';

/**
 * Axios 인스턴스 생성
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * - Authorization 헤더 추가 (JWT 토큰)
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * - 에러 처리 (401: 토큰 만료 등)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && window.location.pathname !== '/auth') {
      // 토큰 만료 → 재로그인 필요
      clearAccessToken();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
