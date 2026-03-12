'use client';

import { FC } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import DataRenderer from './DataRenderer';
import { sanitizeStreamingMarkdown } from '@/utils/markdownUtils';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingDisplayText?: string;
  chartPayload?: { chartType: 'line' | 'bar' | 'pie' | 'table'; data: any[] } | null;
  showSpinner?: boolean;
}

// ── ReactMarkdown 유틸 ───────────────────────────────────────────────────────
function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/(#{1,3})([^\s#\n])/g, '$1 $2')
    .replace(/([^\n])(#{1,3} )/g, '$1\n\n$2')
    .replace(/([^\n])(- )/g, '$1\n$2')
    .replace(/([^\n])---/g, '$1\n\n---')
    .replace(/---([^\n])/g, '---\n\n$1')
    .replace(/([^\n])\*\*\*/g, '$1\n\n***')
    .replace(/\*\*\*([^\n])/g, '***\n\n$1')
    .replace(/ {2,}/g, ' ');
}

function cleanContent(content: string): string {
  return content
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (t.startsWith('|') && t.includes('---')) return false;
      if (t.startsWith('|') && t.endsWith('|')) return false;
      return true;
    })
    .join('\n')
    .trim();
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export const ChatMessage: FC<ChatMessageProps> = ({ message, isStreaming = false, streamingDisplayText, chartPayload, showSpinner = false }) => {
  const isUser = message.role === 'user';

  const processedContent = isUser
    ? message.content.replace(/\\n/g, '\n').replace(/\\r/g, '')
    : cleanContent(normalizeMarkdown(message.content));

  // 스트리밍 중이고 displayText도 없으면 렌더링 스킵
  if (!isUser && streamingDisplayText === undefined && !message.content) {
    return null;
  }

  // 유저 메시지
  if (isUser) {
    return (
      <div className="flex w-full justify-end mb-12">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div
            className="text-[15px] leading-relaxed break-words whitespace-pre-wrap"
            style={{
              padding: '14px 20px',
              background: 'var(--neutral-100)',
              color: 'var(--neutral-700)',
              borderRadius: '20px 20px 4px 20px',
            }}
          >
            {processedContent}
          </div>
        </div>
      </div>
    );
  }

  // AI 메시지
  return (
    <div className="flex w-full justify-start mb-12 gap-4">
      {/* AI 아바타 */}
      <Image
        src="/apple_logo.png"
        alt="nADu"
        width={32}
        height={32}
        className="shrink-0"
        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px', flexShrink: 0 }}
        unoptimized
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div
          className="chat-markdown text-[15px] leading-[1.8] tracking-[-0.01em] break-words"
          style={{ color: 'var(--neutral-700)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-6 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-6 space-y-2.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-6 space-y-2.5">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: 'var(--neutral-700)' }}>{children}</strong>
              ),
              h1: ({ children }) => (
                <h1 className="text-[20px] font-bold mt-10 mb-5" style={{ color: 'var(--neutral-700)' }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[18px] font-bold mt-8 mb-4" style={{ color: 'var(--neutral-700)' }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[16px] font-bold mt-6 mb-3" style={{ color: 'var(--neutral-700)' }}>{children}</h3>
              ),
              table: ({ children }) => (
                <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: '13px' }}>
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th style={{ padding: '6px 12px', background: 'var(--neutral-50)', borderBottom: '2px solid var(--neutral-200)', textAlign: 'left', color: 'var(--neutral-500)', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--neutral-100)', color: 'var(--neutral-600)', fontSize: '13px' }}>
                  {children}
                </td>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded text-[13.5px] font-mono" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                  {children}
                </code>
              ),
            }}
          >
            {streamingDisplayText !== undefined
              ? (isStreaming
                  ? sanitizeStreamingMarkdown(normalizeMarkdown(streamingDisplayText))
                  : normalizeMarkdown(streamingDisplayText))
              : processedContent}
          </ReactMarkdown>
          {isStreaming && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 rounded-sm align-middle animate-pulse"
              style={{ background: 'var(--primary-500)' }}
            />
          )}
        </div>

        {showSpinner && (
          <div className="flex gap-1.5 mt-3">
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary-400)', animationDelay: '300ms' }} />
          </div>
        )}

        {(() => {
          const effective = chartPayload ?? (
            message.chartType && message.data?.length
              ? { chartType: message.chartType, data: message.data }
              : null
          );
          return effective && effective.data.length > 0 ? (
            <DataRenderer chartType={effective.chartType} data={effective.data} />
          ) : null;
        })()}
      </div>
    </div>
  );
};

export default ChatMessage;