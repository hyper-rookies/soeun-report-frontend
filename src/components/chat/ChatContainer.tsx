'use client';

import { FC } from 'react';
import { useSSE } from '@/hooks/useSSE';
import { useChatStore } from '@/store';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  conversationId: string;
}

export const ChatContainer: FC<ChatContainerProps> = ({ conversationId }) => {
  const { messages, isLoading, error, isStreamingComplete } = useChatStore();
  const { sendMessage } = useSSE(conversationId);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-canvas)] overflow-hidden">
      {/* 에러 표시 */}
      {error && (
        <div className="bg-[hsl(0,70%,96%)] border-b border-[hsl(0,72%,52%)] p-3 flex justify-center">
          <p className="text-[hsl(0,72%,40%)] text-[13px] font-medium">{error}</p>
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