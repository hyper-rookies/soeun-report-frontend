import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import { getAccessToken } from '@/lib/auth';

/**
 * Chat 서비스 - SSE 스트리밍
 */
export const chatService = {
  /**
   * SSE를 통해 채팅 메시지 전송 및 응답 수신
   *
   * @param conversationId 대화 ID
   * @param message 사용자 메시지
   * @param onData 청크 데이터 수신 콜백
   * @param onComplete 완료 콜백
   * @param onError 에러 콜백
   */
  sendMessage: async (
    conversationId: string,
    message: string,
    onData: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    onStructuredData?: (data: Record<string, unknown>[]) => void
  ): Promise<void> => {
    try {
      const token = getAccessToken();

      // SSE fetch 요청
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHAT.SEND(conversationId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          // 빈 줄 = SSE 이벤트 구분자 → event type 초기화
          if (line === '') {
            currentEventType = '';
            continue;
          }

          if (line.startsWith('event:')) {
            currentEventType = line.substring(6).trim();
            if (currentEventType === 'done') {
              onComplete();
              return;
            } else if (currentEventType === 'error') {
              onError(ERROR_MESSAGES.SERVER_ERROR);
              return;
            }
            continue;
          }

          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (!data) continue;

            if (currentEventType === 'data') {
              // SSE "data" 이벤트 → JSON 배열 파싱 후 onStructuredData 호출
              try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                  onStructuredData?.(parsed as Record<string, unknown>[]);
                }
              } catch {
                // 파싱 실패 시 무시
              }
            } else {
              // SSE "message" 이벤트 → 텍스트 청크 append
              onData(data);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR;
      onError(errorMessage);
    }
  },
};

export default chatService;
