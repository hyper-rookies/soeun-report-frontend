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
      <div className="flex items-center justify-center h-full text-[var(--text-ghost)]">
        <div className="text-center">
          <p className="text-[14px] font-medium tracking-[-0.01em] mb-1">대화 기록이 없습니다</p>
          <p className="text-[13px] text-[var(--text-soft)]">분석하고 싶은 내용을 하단에 입력해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreaming = isLastMessage && isLoading && !isStreamingComplete;

          return (
            <ChatMessage
              // 핵심 수정: timestamp, role, index를 조합하여 완벽하게 고유한 키 생성
              key={`${message.timestamp}-${message.role}-${index}`}
              message={message}
              isStreaming={isStreaming}
            />
          );
        })}

        {/* 로딩 인디케이터: 통통 튀는 공 대신 전문적인 펄스 효과 */}
        {isLoading && isStreamingComplete && (
          <div className="flex w-full mb-6 justify-start">
            <div className="px-5 py-4 bg-[var(--surface-ai)] border-l-[3px] border-l-[var(--border-default)] rounded-r-[8px]">
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-dim)] font-medium animate-pulse">
                <svg className="w-4 h-4 text-[var(--accent-default)] animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                데이터를 분석하고 있습니다...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;