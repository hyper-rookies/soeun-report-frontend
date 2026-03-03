'use client';

import { FC, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreamingComplete: boolean;
}

/**
 * 메시지 목록 표시 및 자동 스크롤 컴포넌트
 */
export const ChatWindow: FC<ChatWindowProps> = ({
  messages,
  isLoading,
  isStreamingComplete,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 빈 상태
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">대화가 없습니다</p>
          <p className="text-sm">메시지를 입력해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isStreaming = isLastMessage && isLoading && !isStreamingComplete;

        return (
          <ChatMessage
            key={message.timestamp}
            message={message}
            isStreaming={isStreaming}
          />
        );
      })}

      {/* 로딩 인디케이터 (응답 대기 중) */}
      {isLoading && isStreamingComplete && (
        <div className="flex gap-3">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        </div>
      )}

      {/* 스크롤 앵커 */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
