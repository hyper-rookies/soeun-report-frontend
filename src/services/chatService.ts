import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

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
    onStructuredData?: (payload: { chartType: string; data: Record<string, unknown>[] }) => void,
    onStatus?: (step: string, message: string) => void
  ): Promise<void> => {
    try {
      // SSE fetch 요청 (401 시 토큰 리프레시 후 재시도)
      const response = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHAT.SEND(conversationId)}`,
        {
          method: 'POST',
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
          // 빈 줄 = SSE 이벤트 경계 → currentEventType 리셋
          if (line.trim() === '') {
            currentEventType = '';
            continue;
          }

          // event: 라인 → 무조건 타입 갱신 (빈 줄 없이 연속으로 와도 처리)
          if (line.startsWith('event:')) {
            currentEventType = line.substring(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            // SSE 스펙: "data:" 다음 공백 1개만 제거 (trim 금지 - 공백 청크 유실 방지)
            const raw = line.substring(5);
            const data = raw.startsWith(' ') ? raw.substring(1) : raw;

            // 텍스트 청크는 빈 문자열도 허용 (공백만 있는 청크 보존)
            // status/data/done/error 이벤트만 빈 값 스킵
            if (!data && currentEventType !== '' && currentEventType !== 'message') continue;

            switch (currentEventType) {
              case 'done':
                onComplete();
                return;

              case 'error':
                onError(ERROR_MESSAGES.SERVER_ERROR);
                return;

              case 'status':
                if (!data) break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed?.step && parsed?.message) {
                    onStatus?.(parsed.step, parsed.message);
                  }
                } catch { /* 무시 */ }
                break;

              case 'data':
                if (!data) break;
                try {
                  const parsed = JSON.parse(data);
                  if (
                    parsed &&
                    typeof parsed === 'object' &&
                    'chartType' in parsed &&
                    Array.isArray(parsed.data)
                  ) {
                    onStructuredData?.({
                      chartType: parsed.chartType as string,
                      data: parsed.data as Record<string, unknown>[],
                    });
                  }
                } catch { /* 무시 */ }
                break;

              default:
                if (data.startsWith('request_type:')) break;
                onData(data);
                break;
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
