'use client';

import { FC } from 'react';
import { useSSE } from '@/hooks/useSSE';
import { useChatStore } from '@/store';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  conversationId: string;
}

/**
 * 채팅 창 통합 컴포넌트
 */
export const ChatContainer: FC<ChatContainerProps> = ({ conversationId }) => {
  const { messages, isLoading, error, isStreamingComplete } = useChatStore();
  const { sendMessage } = useSSE(conversationId);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* 메시지 윈도우 */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        isStreamingComplete={isStreamingComplete}
      />

      {/* 입력 폼 */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        disabled={!conversationId}
      />
    </div>
  );
};

export default ChatContainer;
