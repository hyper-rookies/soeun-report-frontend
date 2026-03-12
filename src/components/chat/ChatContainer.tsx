'use client';

import { FC, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSSE } from '@/hooks/useSSE';
import { useChatStore } from '@/store';
import { conversationService } from '@/services';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  conversationId: string; // 'new' | 실제 UUID
  presetValue?: string;
}

export const ChatContainer: FC<ChatContainerProps> = ({ conversationId, presetValue }) => {
  const router = useRouter();
  
  // ✅ Store에서 상태 및 액션 추출
  const store = useChatStore();
  const { messages, isLoading, error, isStreamingComplete } = store;
  const setConversationId = useChatStore((s) => s.setConversationId);
  const addConversation = useChatStore((s) => s.addConversation);

  // 'new' 상태에서는 훅에 빈 문자열 전달 → 유효성 검사 통과 후 targetId로 실제 전송
  const { sendMessage, displayText, isStreaming, chartPayload, statusMessage } = useSSE(conversationId === 'new' ? '' : conversationId);

  const handleSendMessage = async (message: string) => {
    let targetId = conversationId;

    // ─── 첫 채팅 (New Conversation) 처리 ───
    if (conversationId === 'new') {
      // 🍎 [개선] 첫 채팅 시 즉시 로딩 트리거 (분석 중... 표시 시작)
      store.setLoading(true);
      store.setError(null);

      try {
        // 1. 타이틀 생성 및 대화 생성 API 호출
        const title = message.length > 40 ? message.slice(0, 40) + '…' : message;
        const summary = await conversationService.createConversation(title);
        
        if (!summary?.id) {
          store.setLoading(false);
          return;
        }

        // 2. 스토어 상태 업데이트
        targetId = summary.id;
        setConversationId(targetId);
        addConversation(summary);
        
        // 3. URL 변경
        router.replace(`/chat/${targetId}`);
        await new Promise(resolve => setTimeout(resolve, 0)); // 재마운트 대기
        store.setLoading(true); // 재마운트 후 store 재확인용
      } catch (err) {
        console.error('[ChatContainer] 생성 실패:', err);
        store.setError('대화를 시작하지 못했습니다. 다시 시도해주세요.');
        store.setLoading(false);
        return;
      }
    }

    // ─── 실제 메시지 전송 (SSE 시작) ───
    // targetId를 명시적으로 넘겨주어 'new' -> 실제 ID로의 전환을 완료합니다.
    await sendMessage(message, targetId);
  };

  // presetValue 처리: 홈 화면 추천 질문 클릭 시 URL 정리
  const hasCleanedUrlRef = useRef(false);
  useEffect(() => {
    if (!presetValue || conversationId === 'new' || hasCleanedUrlRef.current) return;
    hasCleanedUrlRef.current = true;
    router.replace(`/chat/${conversationId}`, { scroll: false });
  }, [conversationId, presetValue, router]);

  return (
    <div 
      className="flex flex-col h-full overflow-hidden" 
      style={{ background: 'var(--neutral-50)' }}
    >
      {/* 에러 배너 */}
      {error && (
        <div
          className="flex justify-center px-4 py-3 animate-in fade-in slide-in-from-top duration-300"
          style={{
            background: 'var(--primary-100)',
            borderBottom: '1px solid var(--primary-200)',
            zIndex: 10,
          }}
        >
          <p className="text-[13px] font-medium" style={{ color: 'var(--primary-700)' }}>
            {error}
          </p>
        </div>
      )}

      {/* 메시지 윈도우: isLoading이 true일 때 '분석 중...' 렌더링 */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        isStreamingComplete={isStreamingComplete}
        isNewChat={conversationId === 'new'}
        streamingDisplayText={displayText}
        isStreamingActive={isStreaming}
        streamingChartPayload={chartPayload}
        statusMessage={statusMessage}
      />

      {/* 입력 폼 */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        disabled={false}
        presetValue={presetValue}
      />
    </div>
  );
};

export default ChatContainer;