/**
 * API 응답 래퍼
 */
export interface ApiResponse<T = any> {
  code: string;
  message: string;
  data?: T;
  timestamp: number;
}

/**
 * Pagination
 */
export interface Pagination {
  page: number;
  size: number;
  total: number;
}

/**
 * API 요청 옵션
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
}
