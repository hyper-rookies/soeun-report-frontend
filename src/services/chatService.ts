import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';

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
    onError: (error: string) => void
  ): Promise<void> => {
    try {
      const token = localStorage.getItem('access_token');

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('event:') && !line.startsWith('data:')) {
            continue;
          }

          if (line.startsWith('event:')) {
            const eventType = line.substring(6).trim();
            if (eventType === 'done') {
              onComplete();
              return;
            } else if (eventType === 'error') {
              onError(ERROR_MESSAGES.SERVER_ERROR);
              return;
            }
          }

          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data) {
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
