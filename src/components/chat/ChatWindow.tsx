'use client';

import { FC, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreamingComplete: boolean;
  isNewChat?: boolean; // 추가된 속성
}

export const ChatWindow: FC<ChatWindowProps> = ({
  messages,
  isLoading,
  isStreamingComplete,
  isNewChat = false,
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

  if (messages.length === 0) {
    // /chat/new 경로일 경우 겹치는 환영 화면 대신 빈 화면 렌더링
    if (isNewChat) {
      return <div className="flex-1" style={{ background: 'var(--neutral-50)' }} />;
    }

    return (
      <div
        className="flex flex-col items-center justify-center h-full px-4"
        style={{ background: 'var(--neutral-50)' }}
      >
        {/* 🍎 AI 아이콘 대신 사과 로고 적용 (Next Image 컴포넌트로 렌더링 보장) */}
        <Image
          src="/apple_logo.png"
          alt="AI 사과 로고"
          width={64}
          height={64}
          priority
          unoptimized
          className="mb-5"
          style={{
            objectFit: 'contain',
          }}
        />

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
          <div className="flex w-full justify-start mb-12 gap-4">
            {/* 🍎 분석 중 아이콘도 사과 로고로 교체 (Next Image 컴포넌트 사용) */}
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

        <div ref={messagesEndRef} className="h-6" />
      </div>
    </div>
  );
};

export default ChatWindow;