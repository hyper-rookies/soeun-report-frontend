/**
 * 채팅 메시지 타입
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
