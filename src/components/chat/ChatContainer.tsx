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
  const { messages, isLoading, error, isStreamingComplete } = useChatStore();
  const setConversationId = useChatStore((s) => s.setConversationId);
  const addConversation    = useChatStore((s) => s.addConversation);

  // 'new' 상태에서는 훅에 빈 문자열 전달 → 유효성 검사 통과 후 override로 실제 ID 사용
  const { sendMessage } = useSSE(conversationId === 'new' ? '' : conversationId);

  const handleSendMessage = async (message: string) => {
    let targetId = conversationId;

    if (conversationId === 'new') {
      const title = message.length > 40 ? message.slice(0, 40) + '…' : message;
      const summary = await conversationService.createConversation(title);
      if (!summary?.id) return;

      targetId = summary.id;
      setConversationId(targetId);
      addConversation(summary);
      router.replace(`/chat/${targetId}`);
    }

    await sendMessage(message, targetId);
  };

  // presetValue: 홈 화면 추천 질문 클릭 시 ?preset= 파라미터 → URL만 정리 (전송은 사용자가 직접)
  const hasCleanedUrlRef = useRef(false);
  useEffect(() => {
    if (!presetValue || conversationId === 'new' || hasCleanedUrlRef.current) return;
    hasCleanedUrlRef.current = true;
    router.replace(`/chat/${conversationId}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, presetValue]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--neutral-50)' }}>
      {/* 에러 배너 */}
      {error && (
        <div
          className="flex justify-center px-4 py-3"
          style={{
            background: 'var(--primary-100)',
            borderBottom: '1px solid var(--primary-200)',
          }}
        >
          <p className="text-[13px] font-medium" style={{ color: 'var(--primary-700)' }}>{error}</p>
        </div>
      )}

      {/* 메시지 윈도우 */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        isStreamingComplete={isStreamingComplete}
        isNewChat={conversationId === 'new'} // isNewChat 전달
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