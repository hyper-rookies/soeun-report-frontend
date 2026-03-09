import { useCallback, useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { ChatMessage, StreamNode, StreamNodeType } from '@/types/chat';

/**
 * 텍스트 첫 줄을 보고 노드 타입 결정
 */
function detectNodeType(text: string): StreamNodeType {
  const t = text.trimStart();
  const hMatch = t.match(/^(#{1,6})\s/);
  if (hMatch) return `h${hMatch[1].length}` as StreamNodeType;
  if (/^[-*]\s/.test(t)) return 'ul';
  if (/^\d+\.\s/.test(t)) return 'ol';
  if (/^-{3,}\s*$/.test(t)) return 'hr';
  if (/^```/.test(t)) return 'code';
  return 'paragraph';
}

/**
 * SSE 연결 및 메시지 송수신 관리 훅
 */
type ChartType = 'line' | 'bar' | 'pie' | 'table';

export const useSSE = (conversationId: string) => {
  const store = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // setLoading만 분리 — store 전체 구독 방지
  const { setLoading } = store;

  // 노드 스트리밍 상태
  const [nodes, setNodes] = useState<StreamNode[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chartPayload, setChartPayload] = useState<{
    chartType: ChartType;
    data: unknown[];
  } | null>(null);
  const chartPayloadRef = useRef<{ chartType: ChartType; data: Record<string, unknown>[] } | null>(null);
  const nodesRef = useRef<StreamNode[]>([]);
  const pendingTextRef = useRef('');   // 마지막 \n\n 이후 아직 완료되지 않은 텍스트
  const nodeCounterRef = useRef(0);
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

      // 노드 상태 초기화
      nodesRef.current = [];
      pendingTextRef.current = '';
      nodeCounterRef.current = 0;
      isFirstChunkRef.current = true;
      setNodes([]);
      setIsStreaming(false);
      setChartPayload(null);
      chartPayloadRef.current = null;

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

      // 노드 배열을 ref와 state 동시 갱신
      const updateNodes = (updated: StreamNode[]) => {
        nodesRef.current = updated;
        setNodes([...updated]);
      };

      try {
        await chatService.sendMessage(
          actualId,
          userMessage,
          // onData: 청크 수신 → store 누적 + 노드 파싱
          (chunk: string) => {
            store.appendToLastMessage(chunk);

            // 첫 청크: isLoading → false, isStreaming → true
            if (isFirstChunkRef.current) {
              isFirstChunkRef.current = false;
              store.setLoading(false);
              setIsStreaming(true);
            }

            pendingTextRef.current += chunk;
            const parts = pendingTextRef.current.split('\n\n');
            pendingTextRef.current = parts.pop()!;

            const currentNodes = [...nodesRef.current];

            // \n\n 이전 세그먼트들 → 완료 노드 처리
            for (const segment of parts) {
              if (!segment.trim()) continue;
              const last = currentNodes[currentNodes.length - 1];
              if (last && !last.complete) {
                // 진행 중이던 노드를 최종 내용으로 완료
                currentNodes[currentNodes.length - 1] = {
                  ...last,
                  content: segment,
                  type: detectNodeType(segment),
                  complete: true,
                };
              } else {
                nodeCounterRef.current++;
                currentNodes.push({
                  id: nodeCounterRef.current,
                  type: detectNodeType(segment),
                  content: segment,
                  complete: true,
                });
              }
            }

            // \n\n 이후 남은 텍스트 → 진행 중 노드 갱신
            if (pendingTextRef.current) {
              const last = currentNodes[currentNodes.length - 1];
              if (last && !last.complete) {
                currentNodes[currentNodes.length - 1] = {
                  ...last,
                  content: pendingTextRef.current,
                  type: detectNodeType(pendingTextRef.current),
                };
              } else {
                nodeCounterRef.current++;
                currentNodes.push({
                  id: nodeCounterRef.current,
                  type: detectNodeType(pendingTextRef.current),
                  content: pendingTextRef.current,
                  complete: false,
                });
              }
            }

            updateNodes(currentNodes);
          },
          // onComplete: 마지막 노드 완료 처리 + chartPayload store attach
          () => {
            const currentNodes = [...nodesRef.current];
            const last = currentNodes[currentNodes.length - 1];
            if (last && !last.complete) {
              currentNodes[currentNodes.length - 1] = { ...last, complete: true };
              updateNodes(currentNodes);
            }
            // chartPayload가 있으면 마지막 메시지에 attach 후 리셋
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
    nodes,
    chartPayload,
    error: store.error,
    isStreamingComplete: store.isStreamingComplete,
  };
};

export default useSSE;