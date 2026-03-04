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

  // ✅ [해결의 핵심]: 전체 store가 아닌, 변경되지 않는 함수(setLoading)만 빼서 사용
  const { setLoading } = store;

  /**
   * SSE 연결 해제
   * 이제 store가 바뀌어도 이 함수는 재시동되지 않으므로 무한 루프가 끊어짐!
   */
  const closeConnection = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, [setLoading]);

  /**
   * 컴포넌트 언마운트 시 연결 정리
   * closeConnection이 안전하게 고정되었으므로 마운트/언마운트 시 1번만 실행됨
   */
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  /**
   * 메시지 전송 및 SSE 스트리밍 시작
   * @param userMessage 전송할 메시지
   * @param targetId 실제 전송 대상 conversationId (생략 시 훅 초기화 값 사용)
   *                 'new' 모드에서 대화를 먼저 생성한 후 실제 id를 전달할 때 사용
   */
  const sendMessage = useCallback(
    async (userMessage: string, targetId?: string) => {
      const actualId = targetId ?? conversationId;

      // 유효성 검사
      if (!userMessage.trim()) {
        store.setError('메시지를 입력해주세요.');
        return;
      }

      if (!actualId || actualId === 'new') {
        store.setError('대화 세션이 없어요.');
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
          actualId,
          userMessage,
          // onData: 텍스트 청크 수신
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
          },
          // onStructuredData: SSE "data" 이벤트 (차트/표)
          (data: Record<string, unknown>[]) => {
            store.setLastMessageData(data);
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '예상치 못한 오류가 발생했어요.';
        store.setError(errorMessage);
        store.setLoading(false);
      }
    },
    [conversationId, store]
  );

  return {
    sendMessage,
    closeConnection,
    isLoading: store.isLoading,
    error: store.error,
    isStreamingComplete: store.isStreamingComplete,
  };
};

export default useSSE;