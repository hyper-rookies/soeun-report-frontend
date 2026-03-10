import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/utils/constants';
import { ApiError } from '@/types';
import { getAccessToken, clearTokens, refreshTokenOnce } from '@/lib/auth';

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
 * - 401 → 리프레시 토큰으로 자동 재발급, 실패 시 로그인 이동
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/auth'
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshTokenOnce();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        clearTokens();
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export interface DashboardSummaryResponse {
  adCost: {
    today: number
    yesterday: number
    thisWeek: number
    todayChangeRate: number
    thisWeekChangeRate: number
  }
  mediaShare: {
    name: string
    value: number
  }[]
  dailyConversions: {
    date: string
    conversions: number
    clicks: number
  }[]
  performanceMetrics: {
    cpc: number
    ctr: number
    roas: number
  }
}

export const getDashboardSummary = (): Promise<DashboardSummaryResponse> =>
  apiClient.get('/api/dashboard/summary').then(res => res.data)
