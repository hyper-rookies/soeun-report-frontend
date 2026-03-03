import { useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { ChatMessage } from '@/types/chat';

/**
 * SSE 연결 및 메시지 송수신 관리 훅
 */
export const useSSE = (conversationId: string) => {
  const store = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 메시지 전송 및 SSE 스트리밍 시작
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      // 유효성 검사
      if (!userMessage.trim()) {
        store.setError('메시지를 입력해주세요.');
        return;
      }

      if (!conversationId) {
        store.setError('대화 세션이 없습니다.');
        return;
      }

      // 요청 시작
      store.setLoading(true);
      store.setError(null);
      store.setStreamingComplete(false);

      // 사용자 메시지 저장
      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      };
      store.addMessage(userMsg);

      // Assistant 메시지 플레이스홀더 추가 (스트리밍용)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      store.addMessage(assistantMsg);

      try {
        // SSE 요청
        await chatService.sendMessage(
          conversationId,
          userMessage,
          // onData: 청크 데이터 수신
          (chunk: string) => {
            store.appendToLastMessage(chunk);
          },
          // onComplete: 스트리밍 완료
          () => {
            store.setLoading(false);
            store.setStreamingComplete(true);
          },
          // onError: 에러 발생
          (error: string) => {
            store.setError(error);
            store.setLoading(false);
            // 에러 시 빈 assistant 플레이스홀더 제거
            const messages = store.messages.slice(0, -1);
            store.clearMessages();
            messages.forEach((msg) => store.addMessage(msg));
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '예상치 못한 오류가 발생했습니다.';
        store.setError(errorMessage);
        store.setLoading(false);
      }
    },
    [conversationId, store]
  );

  /**
   * SSE 연결 해제
   */
  const closeConnection = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    store.setLoading(false);
  }, [store]);

  /**
   * 컴포넌트 언마운트 시 연결 정리
   */
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  return {
    sendMessage,
    closeConnection,
    isLoading: store.isLoading,
    error: store.error,
    isStreamingComplete: store.isStreamingComplete,
  };
};

export default useSSE;
