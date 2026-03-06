'use client';

import { FC, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, StreamNode } from '@/types/chat';
import ChatMessage from './ChatMessage';
import Image from 'next/image';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreamingComplete: boolean;
  isNewChat?: boolean;
  streamingNodes?: StreamNode[];
  isStreamingActive?: boolean;
}

export const ChatWindow: FC<ChatWindowProps> = ({
  messages,
  isLoading,
  isStreamingComplete,
  isNewChat = false,
  streamingNodes,
  isStreamingActive = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const lastMsg = messages[messages.length - 1];
  const showLoadingDots = isLoading;

  const displayMessages =
    isLoading && lastMsg?.role === 'assistant' && lastMsg?.content === ''
      ? messages.slice(0, -1)
      : messages;

  if (messages.length === 0 && !isLoading) {
    return <div className="flex-1" style={{ background: 'var(--neutral-50)' }} />;
  }

  return (
    <div
      className="flex-1"
      style={{
        overflowY: 'auto',
        background: 'var(--neutral-50)',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div
        style={{
          maxWidth: '768px',
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '32px',
          paddingBottom: '80px', // 하단 인풋과의 여유 공간
          display: 'flex',       // 메시지 간 간격을 위해 flex 추가
          flexDirection: 'column',
          gap: '40px',          // 🍎 질문-답변, 답변-답변 사이의 간격을 40px로 넉넉히 설정
        }}
      >
        {displayMessages.map((message, index) => {
          const isLastMessage = index === displayMessages.length - 1;
          const isStreaming = isLastMessage && (isStreamingActive || (isLoading && !isStreamingComplete));
          const nodes = isLastMessage ? streamingNodes : undefined;

          return (
            <ChatMessage
              key={`${message.timestamp}-${message.role}-${index}`}
              message={message}
              isStreaming={isStreaming}
              nodes={nodes}
            />
          );
        })}

        {/* 바운싱 점 — 첫 청크 도착 전 */}
        {showLoadingDots && (
          <div className="flex w-full justify-start gap-4" style={{ marginTop: '-8px' }}>
            <Image
              src="/apple_logo.png"
              alt="분석 중..."
              width={32}
              height={32}
              priority
              unoptimized
              className="rounded-full shrink-0 mt-0.5"
              style={{
                boxShadow: 'var(--shadow-sm)',
                objectFit: 'cover'
              }}
            />
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--neutral-400)' }}>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '300ms' }} />
              </div>
              <span>분석 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>
    </div>
  );
};

export default ChatWindow;