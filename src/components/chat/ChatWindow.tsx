'use client';

import { FC, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreamingComplete: boolean;
}

export const ChatWindow: FC<ChatWindowProps> = ({
  messages,
  isLoading,
  isStreamingComplete,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[var(--surface-canvas)] px-4">
        <div className="w-12 h-12 mb-4 rounded-full bg-[var(--surface-ai)] border border-[var(--border-default)] flex items-center justify-center text-[22px]">✨</div>
        <p className="text-[17px] font-semibold text-[var(--text-ink)] mb-1.5 tracking-[-0.01em]">무엇을 분석해 드릴까요?</p>
        <p className="text-[13px] text-[var(--text-soft)]">카카오 모먼트나 구글 검색광고의 성과를 질문해 보세요.</p>
      </div>
    );
  }

  return (
    // 💡 핵심 픽스: flex 속성을 빼고 단순 block 처리 후, 내부를 800px로 묶어서 강제 중앙 정렬
    <div className="flex-1 overflow-y-auto w-full bg-[var(--surface-canvas)] py-8 scroll-smooth">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 flex flex-col">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreaming = isLastMessage && isLoading && !isStreamingComplete;

          return (
            <ChatMessage
              key={`${message.timestamp}-${message.role}-${index}`}
              message={message}
              isStreaming={isStreaming}
            />
          );
        })}

        {/* 로딩 인디케이터 */}
        {isLoading && isStreamingComplete && (
          <div className="flex w-full justify-start mb-8 gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <span className="text-white text-[16px] leading-none animate-pulse">✨</span>
             </div>
             <div className="flex items-center gap-2 text-[15px] text-gray-500 font-medium">
               <span className="animate-pulse">데이터를 조회하고 분석하는 중입니다...</span>
             </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-6" />
      </div>
    </div>
  );
};

export default ChatWindow;