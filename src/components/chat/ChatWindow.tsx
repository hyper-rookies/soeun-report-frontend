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

  const lastMsg = messages[messages.length - 1];
  const showLoadingDots =
    isLoading && lastMsg?.role === 'assistant' && lastMsg?.content === '';
  const displayMessages = showLoadingDots ? messages.slice(0, -1) : messages;

  if (messages.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full px-4"
        style={{ background: 'var(--neutral-50)' }}
      >
        {/* AI 아이콘 */}
        <div
          className="w-14 h-14 mb-5 rounded-2xl flex items-center justify-center"
          style={{
            background: 'var(--primary-500)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <p
          className="text-[18px] font-bold mb-2 tracking-[-0.02em]"
          style={{ color: 'var(--neutral-700)' }}
        >
          무엇을 도와드릴까요?
        </p>
        <p className="text-[13px]" style={{ color: 'var(--neutral-400)' }}>
          카카오 키워드와 구글 검색광고의 성과를 질문해 보세요.
        </p>

        {/* 예시 질문 힌트 */}
        <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
          {[
            '지난 7일 카카오 광고 CTR을 알려줘',
            '구글 광고 클릭수가 가장 높은 캠페인은?',
            '이번 달 전환율 추이를 보여줘',
          ].map((hint) => (
            <div
              key={hint}
              className="px-4 py-3 rounded-lg text-[13px] cursor-default"
              style={{
                background: 'var(--white)',
                border: '1px solid var(--neutral-100)',
                color: 'var(--neutral-500)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {hint}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1"
      style={{
        overflowY: 'auto',
        background: 'var(--neutral-50)',
        width: '100%',      // flex item cross-axis 명시적 고정
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
          paddingBottom: '8px',
        }}
      >
        {displayMessages.map((message, index) => {
          const isLastMessage = index === displayMessages.length - 1;
          const isStreaming = isLastMessage && isLoading && !isStreamingComplete;

          return (
            <ChatMessage
              key={`${message.timestamp}-${message.role}-${index}`}
              message={message}
              isStreaming={isStreaming}
            />
          );
        })}

        {/* 바운싱 점 — 첫 청크 도착 전 */}
        {showLoadingDots && (
          <div className="flex w-full justify-start mb-8 gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: 'var(--primary-500)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--neutral-400)' }}>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '300ms' }} />
              </div>
              <span>생각 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-6" />
      </div>
    </div>
  );
};

export default ChatWindow;
