/**
 * 채팅 메시지 타입
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: Record<string, unknown>[];  // 차트/표 구조 데이터 (SSE "data" 이벤트)
}

/**
 * 사용자 채팅 요청
 */
export interface ChatRequest {
  message: string;
}

/**
 * 서버 응답 (사용하지 않음 - SSE 사용)
 */
export interface ChatResponse {
  conversationId: string;
  content: string;
}

/**
 * 대화 세션
 */
export interface Conversation {
  id: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

/**
 * 대화 요약 (목록 조회용)
 */
export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
}

/**
 * SSE 스트리밍 노드 타입
 */
export type StreamNodeType =
  | 'paragraph'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'ol' | 'ul'
  | 'hr'
  | 'code';

export interface StreamNode {
  id: number;
  type: StreamNodeType;
  content: string;
  complete: boolean;
}

/**
 * SSE 이벤트
 */
export interface SSEEvent {
  name?: string;
  data: string;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  errorCode: string;
  message: string;
  status: number;
}
