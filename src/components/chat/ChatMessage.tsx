'use client';

import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export const ChatMessage: FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';

  // 1. 기본 줄바꿈 문자 치환
  let processedContent = message.content
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '');

  // 2. 💡 백엔드에서 잃어버린 줄바꿈을 프론트에서 정규식으로 완벽 복원!
  if (!isUser) {
    processedContent = processedContent
      // 주요 이모지 앞에서 크게 줄바꿈
      .replace(/(📊|⚠️|🔍|📝)/g, '\n\n$1 ')
      // 헤더(###) 앞에서 크게 줄바꿈 + 뒤에 띄어쓰기 보장
      .replace(/(###)\s*/g, '\n\n### ')
      // 숫자형 리스트 (1., 2.) 분리 (소수점 6.65% 같은 건 무시하도록 처리)
      .replace(/(\d+\.)(?![\d])/g, '\n$1 ')
      // 하이픈(-) 리스트 분리 (음수와 헷갈리지 않게 뒤에 글자가 올 때만)
      .replace(/(-\s*[가-힣a-zA-Z])/g, '\n$1 ');
  }

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative ${
          isUser
            ? 'max-w-[80%] lg:max-w-2xl px-5 py-3.5 bg-[var(--surface-well)] border border-[var(--border-default)] rounded-[8px] text-[var(--text-ink)]'
            : 'w-full px-6 py-5 bg-[var(--surface-ai)] border border-[var(--border-faint)] border-l-[3px] border-l-[var(--accent-default)] rounded-r-[8px] text-[var(--text-ink)] shadow-sm'
        }`}
      >
        <div className="text-[14px] leading-[1.7] tracking-[-0.01em] break-words">
          {isUser ? (
            <div className="whitespace-pre-wrap">{processedContent}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-[var(--text-dim)]">{children}</ol>,
                li: ({ children }) => <li className="text-[var(--text-dim)]">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-[var(--text-ink)]">{children}</strong>,
                h1: ({ children }) => <h1 className="text-[18px] font-bold mt-6 mb-3 pb-2 border-b border-[var(--border-faint)]">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[16px] font-bold mt-5 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[15px] font-bold mt-5 mb-2 text-[var(--text-ink)]">{children}</h3>,
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4 border border-[var(--border-default)] rounded-lg">
                    <table className="min-w-full divide-y divide-[var(--border-default)]">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="px-4 py-2 bg-[var(--surface-elevated)] text-left text-[13px] font-semibold text-[var(--text-dim)]">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 text-[13px] border-t border-[var(--border-faint)]">{children}</td>,
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[4px] font-mono text-[13px] text-[var(--accent-dark)]">
                    {children}
                  </code>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          )}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--accent-default)] animate-pulse align-middle" />
          )}
        </div>
        
        <div
          className={`text-[11px] mt-3 font-mono ${
            isUser ? 'text-[var(--text-ghost)] text-right' : 'text-[var(--text-soft)]'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;