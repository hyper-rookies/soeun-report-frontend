import { useCallback, useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { ChatMessage } from '@/types/chat';

/**
 * SSE 연결 및 메시지 송수신 관리 훅
 */
type ChartType = 'line' | 'bar' | 'pie' | 'table';

export const useSSE = (conversationId: string) => {
  const store = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // setLoading만 분리 — store 전체 구독 방지
  const { setLoading } = store;

  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [chartPayload, setChartPayload] = useState<{
    chartType: ChartType;
    data: unknown[];
  } | null>(null);
  const chartPayloadRef = useRef<{ chartType: ChartType; data: Record<string, unknown>[] } | null>(null);
  const rawTextRef = useRef('');           // SSE로 받은 전체 텍스트
  const displayTextRef = useRef('');       // 화면에 표시 중인 텍스트
  const [displayText, setDisplayText] = useState('');
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDoneRef = useRef(false);
  const isFirstChunkRef = useRef(true);
  const loadingStartTimeRef = useRef<number>(0);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MIN_LOADING_MS = 5000; // 최소 로딩 표시 시간

  const closeConnection = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  /**
   * 메시지 전송 및 SSE 스트리밍 시작
   * @param userMessage 전송할 메시지
   * @param targetId 실제 전송 대상 conversationId (생략 시 훅 초기화 값 사용)
   */
  const sendMessage = useCallback(
    async (userMessage: string, targetId?: string) => {
      const actualId = targetId ?? conversationId;

      if (!userMessage.trim()) {
        store.setError('메시지를 입력해주세요.');
        return;
      }

      if (!actualId || actualId === 'new') {
        store.setError('대화 세션이 없어요.');
        return;
      }

      // 상태 초기화
      rawTextRef.current = '';
      displayTextRef.current = '';
      isDoneRef.current = false;
      isFirstChunkRef.current = true;
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setDisplayText('');
      setIsStreaming(false);
      setChartPayload(null);
      chartPayloadRef.current = null;
      setStatusMessage(null);
      loadingStartTimeRef.current = Date.now();

      store.setLoading(true);
      store.setError(null);
      store.setStreamingComplete(false);

      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      };
      store.addMessage(userMsg);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      store.addMessage(assistantMsg);

      // ── 타이머 시작 ──────────────────────────────────────────────────
      const startTypewriter = () => {
        if (typewriterTimerRef.current) return;

        typewriterTimerRef.current = setInterval(() => {
          const raw = rawTextRef.current;
          const displayed = displayTextRef.current;

          if (isDoneRef.current) {
            // done 수신 → 즉시 전체 표시 후 타이머 종료
            clearInterval(typewriterTimerRef.current!);
            typewriterTimerRef.current = null;
            displayTextRef.current = raw;
            setDisplayText(raw);
            if (chartPayloadRef.current) {
              store.setLastMessageData(
                chartPayloadRef.current.data,
                chartPayloadRef.current.chartType
              );
              chartPayloadRef.current = null;
              setChartPayload(null);
            }
            setIsStreaming(false);
            store.setLoading(false);
            store.setStreamingComplete(true);
            return;
          }

          if (displayed.length < raw.length) {
            const next = raw.slice(0, displayed.length + 1);
            displayTextRef.current = next;
            setDisplayText(next);
          }
        }, 16); // ~60fps
      };

      try {
        await chatService.sendMessage(
          actualId,
          userMessage,
          // onData: rawText에 누적 후 타이머 시작
          (chunk: string) => {
            store.appendToLastMessage(chunk);
            rawTextRef.current += chunk;

            if (isFirstChunkRef.current) {
              isFirstChunkRef.current = false;
              const elapsed = Date.now() - loadingStartTimeRef.current;
              const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
              loadingTimerRef.current = setTimeout(() => {
                store.setLoading(false);
                setIsStreaming(true);
                setStatusMessage(null);
              }, remaining);
            }

            startTypewriter();
          },
          // onComplete: 플래그 세팅 (타이머가 완료 처리)
          () => {
            isDoneRef.current = true;
          },
          // onError: 에러 처리
          (error: string) => {
            store.setError(error);
            store.setLoading(false);
            setIsStreaming(false);
            const messages = store.messages.slice(0, -1);
            store.clearMessages();
            messages.forEach((msg) => store.addMessage(msg));
          },
          // onStructuredData: 차트/표 데이터 (스트리밍 중 미리 수신)
          (payload: { chartType: string; data: Record<string, unknown>[] }) => {
            const typed = {
              chartType: payload.chartType as ChartType,
              data: payload.data,
            };
            chartPayloadRef.current = typed;
            setChartPayload(typed);
          },
          // onStatus
          (step: string, message: string) => {
            setStatusMessage(message);
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '예상치 못한 오류가 발생했어요.';
        store.setError(errorMessage);
        store.setLoading(false);
        setIsStreaming(false);
      }
    },
    [conversationId, store]
  );

  return {
    sendMessage,
    closeConnection,
    isLoading: store.isLoading,
    isStreaming,
    displayText,
    chartPayload,
    statusMessage,
    error: store.error,
    isStreamingComplete: store.isStreamingComplete,
  };
};

export default useSSE;