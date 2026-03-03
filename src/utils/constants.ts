/**
 * API 기본 설정
 */
export const API_CONFIG = {
  // Dev: reads from .env.local → 'http://localhost:8080'
  // Prod: NEXT_PUBLIC_API_BASE_URL unset → '' → relative paths → Vercel rewrite
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  TIMEOUT: 30000, // 30초
  RETRY_COUNT: 3,
};

/**
 * 애플리케이션 설정
 */
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'SE Report',
  VERSION: '1.0.0',
};

/**
 * Cognito 설정
 */
export const COGNITO_CONFIG = {
  REGION: 'ap-northeast-2',
  DOMAIN: 'https://ap-northeast-2bzej4aji8.auth.ap-northeast-2.amazoncognito.com',
  CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  REDIRECT_URI: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || 'http://localhost:3000/callback',
};

/**
 * API 엔드포인트
 */
export const API_ENDPOINTS = {
  CHAT: {
    SEND: (conversationId: string) => `/api/chat/${conversationId}`,
    HISTORY: (conversationId: string) => `/api/chat/${conversationId}/history`,
  },
  CONVERSATION: {
    LIST: '/api/conversations',
    CREATE: '/api/conversations',
    GET: (id: string) => `/api/conversations/${id}`,
  },
};

/**
 * UI 상수
 */
export const UI_CONFIG = {
  SSE_TIMEOUT: 180000, // 3분 (서버와 동일)
  MESSAGE_MAX_LENGTH: 2000,
  TYPING_INDICATOR_DELAY: 300, // ms
};

/**
 * 에러 메시지
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버에 오류가 발생했습니다.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  INVALID_MESSAGE: '메시지를 입력해주세요.',
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
};
