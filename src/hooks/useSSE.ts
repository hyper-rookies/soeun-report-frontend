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
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const TICK_INTERVAL_MS = 28;
  const CHARS_NORMAL = 2;
  const CHARS_CATCHUP = 5;
  const CHARS_TURBO = 12;
  const isDoneRef = useRef(false);
  const isFirstChunkRef = useRef(true);

  const closeConnection = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    return () => {
      closeConnection();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
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
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastFrameTimeRef.current = 0;
      setDisplayText('');
      setIsStreaming(false);
      setChartPayload(null);
      chartPayloadRef.current = null;
      setStatusMessage(null);

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
        if (rafIdRef.current) return;

        const tick = (timestamp: number) => {
          const raw = rawTextRef.current;
          const displayed = displayTextRef.current;
          const lag = raw.length - displayed.length;

          if (isDoneRef.current && lag === 0) {
            rafIdRef.current = null;
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

          if (lag > 0) {
            const elapsed = timestamp - lastFrameTimeRef.current;

            if (elapsed >= TICK_INTERVAL_MS) {
              lastFrameTimeRef.current = timestamp;

              const charsToAdd = lag >= 120
                ? CHARS_TURBO
                : lag >= 40
                  ? CHARS_CATCHUP
                  : CHARS_NORMAL;

              const next = raw.slice(0, displayed.length + charsToAdd);
              displayTextRef.current = next;
              setDisplayText(next);
            }
          }

          rafIdRef.current = requestAnimationFrame(tick);
        };

        rafIdRef.current = requestAnimationFrame(tick);
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
              setIsStreaming(true);
              setStatusMessage(null);
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