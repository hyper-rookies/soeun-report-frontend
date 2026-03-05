'use client';

import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { DataRenderer } from './DataRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// SSE 스트리밍 텍스트에서 헤딩/리스트/구분선 앞 줄바꿈이 누락될 수 있어 보정
function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/(#{1,3})([^\s#\n])/g, '$1 $2')  // # 뒤 공백 누락 보정 (###제목 → ### 제목)
    .replace(/([^\n])(#{1,3} )/g, '$1\n\n$2')  // ## 앞 줄바꿈 2개 보장
    .replace(/([^\n])(- )/g, '$1\n$2')          // - 리스트 앞 줄바꿈 보장
    .replace(/([^\n])---/g, '$1\n\n---')        // --- 앞 줄바꿈 보장 (hr 인식)
    .replace(/---([^\n])/g, '---\n\n$1')        // --- 뒤 줄바꿈 보장
    .replace(/([^\n])\*\*\*/g, '$1\n\n***')     // *** 앞 줄바꿈 보장 (hr 인식)
    .replace(/\*\*\*([^\n])/g, '***\n\n$1')     // *** 뒤 줄바꿈 보장
    .replace(/ {2,}/g, ' ');                     // 연속 공백 정리
}

// 마크다운 표를 DataRenderer로 위임하므로 표 행 제거
function cleanContent(content: string): string {
  return content
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      // 마크다운 표 구분자 줄 제거 (|---|---|)
      if (t.startsWith('|') && t.includes('---')) return false;
      // 마크다운 표 데이터 행 제거 (| 로 시작하고 | 로 끝나는 줄)
      if (t.startsWith('|') && t.endsWith('|')) return false;
      return true;
    })
    .join('\n')
    .trim();
}

export const ChatMessage: FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';

  const processedContent = isUser
    ? message.content.replace(/\\n/g, '\n').replace(/\\r/g, '')
    : cleanContent(normalizeMarkdown(message.content));

  // 유저 메시지 — 우측 정렬, neutral-100 말풍선
  if (isUser) {
    return (
      <div className="flex w-full justify-end mb-8">
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

  // AI 메시지 — 좌측, 레드 아바타
  return (
    <div className="flex w-full justify-start mb-8 gap-4">
      {/* AI 아바타 */}
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

      <div className="flex-1 min-w-0 flex flex-col">
        <div
          className="text-[15px] leading-[1.8] tracking-[-0.01em] break-words"
          style={{ color: 'var(--neutral-700)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: 'var(--neutral-700)' }}>{children}</strong>
              ),
              h1: ({ children }) => (
                <h1 className="text-[20px] font-bold mt-8 mb-4" style={{ color: 'var(--neutral-700)' }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[18px] font-bold mt-6 mb-3" style={{ color: 'var(--neutral-700)' }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[16px] font-bold mt-5 mb-2" style={{ color: 'var(--neutral-700)' }}>{children}</h3>
              ),
              table: ({ children }) => (
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    margin: '8px 0',
                    fontSize: '13px',
                  }}
                >
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th
                  style={{
                    padding: '6px 12px',
                    background: 'var(--neutral-50)',
                    borderBottom: '2px solid var(--neutral-200)',
                    textAlign: 'left',
                    color: 'var(--neutral-500)',
                    fontWeight: 600,
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--neutral-100)',
                    color: 'var(--neutral-600)',
                    fontSize: '13px',
                  }}
                >
                  {children}
                </td>
              ),
              code: ({ children }) => (
                <code
                  className="px-1.5 py-0.5 rounded text-[13.5px] font-mono"
                  style={{
                    background: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                  }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
          {isStreaming && (
            <span
              className="inline-block w-2 h-4 ml-1 rounded-sm align-middle animate-pulse"
              style={{ background: 'var(--primary-500)' }}
            />
          )}
        </div>

        {message.data && message.data.length > 0 && (
          <DataRenderer data={message.data} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
