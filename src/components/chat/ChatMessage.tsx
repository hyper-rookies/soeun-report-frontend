'use client';

import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType, StreamNode } from '@/types/chat';
import { DataRenderer } from './DataRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  nodes?: StreamNode[];
}

// ── 인라인 마크다운: **bold** / `code` ──────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
          return (
            <strong key={i} className="font-semibold" style={{ color: 'var(--neutral-700)' }}>
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
          return (
            <code
              key={i}
              className="px-1 rounded text-sm font-mono"
              style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        return token || null;
      })}
    </>
  );
}

// ── 스트리밍 커서 ────────────────────────────────────────────────────────────
const Cursor: FC = () => (
  <span
    className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
    style={{ background: 'var(--primary-500)' }}
  />
);

// ── 헤딩 Tailwind 클래스 ─────────────────────────────────────────────────────
const HEADING_CLS: Record<string, string> = {
  h1: 'text-[20px] font-bold mt-6',
  h2: 'text-[18px] font-bold mt-6',
  h3: 'text-[16px] font-bold mt-5',
  h4: 'text-[15px] font-semibold mt-4',
  h5: 'text-[14px] font-semibold mt-4',
  h6: 'text-[13px] font-semibold mt-4',
};

// nodeAppear 애니메이션 — 각 노드가 마운트될 때 한 번 실행
const APPEAR: React.CSSProperties = { animation: 'nodeAppear 0.3s ease-out forwards' };

// ── 노드 단위 렌더러 ─────────────────────────────────────────────────────────
const StreamNodeView: FC<{ node: StreamNode; showCursor: boolean }> = ({ node, showCursor }) => {
  const cursor = showCursor && !node.complete ? <Cursor /> : null;

  // h1 ~ h6
  if (node.type.startsWith('h')) {
    const Tag = node.type as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    const text = node.content.replace(/^#{1,6}\s+/, '');
    return (
      <Tag className={HEADING_CLS[node.type]} style={{ color: 'var(--neutral-700)', ...APPEAR }}>
        {renderInline(text)}{cursor}
      </Tag>
    );
  }

  // hr
  if (node.type === 'hr') {
    return <hr className="my-4" style={{ borderColor: 'var(--neutral-200)', ...APPEAR }} />;
  }

  // code block
  if (node.type === 'code') {
    const codeText = node.content
      .split('\n')
      .filter(l => !l.match(/^```/))
      .join('\n')
      .trim();
    return (
      <pre
        className="rounded-lg overflow-x-auto p-4 text-sm font-mono"
        style={{ background: 'var(--neutral-100)', color: 'var(--neutral-700)', ...APPEAR }}
      >
        <code>{codeText}{cursor}</code>
      </pre>
    );
  }

  // ul
  if (node.type === 'ul') {
    const items = node.content.split('\n').filter(l => l.trim());
    return (
      <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--neutral-700)', ...APPEAR }}>
        {items.map((line, i) => (
          <li key={i}>
            {renderInline(line.replace(/^[-*]\s+/, ''))}
            {i === items.length - 1 && cursor}
          </li>
        ))}
      </ul>
    );
  }

  // ol
  if (node.type === 'ol') {
    const items = node.content.split('\n').filter(l => l.trim());
    return (
      <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--neutral-700)', ...APPEAR }}>
        {items.map((line, i) => (
          <li key={i}>
            {renderInline(line.replace(/^\d+\.\s+/, ''))}
            {i === items.length - 1 && cursor}
          </li>
        ))}
      </ol>
    );
  }

  // paragraph (default)
  return (
    <p style={{ color: 'var(--neutral-700)', ...APPEAR }}>
      {renderInline(node.content)}{cursor}
    </p>
  );
};

// ── ReactMarkdown 폴백용 유틸 (히스토리 메시지) ──────────────────────────────
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
export const ChatMessage: FC<ChatMessageProps> = ({ message, isStreaming = false, nodes }) => {
  const isUser = message.role === 'user';

  const processedContent = isUser
    ? message.content.replace(/\\n/g, '\n').replace(/\\r/g, '')
    : cleanContent(normalizeMarkdown(message.content));

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

  const hasNodes = nodes && nodes.length > 0;

  // AI 메시지
  return (
    <div className="flex w-full justify-start mb-12 gap-4">
      {/* nodeAppear 키프레임 — 스트리밍 시에만 주입 */}
      {hasNodes && (
        <style>{`@keyframes nodeAppear { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }`}</style>
      )}

      {/* AI 아바타 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--primary-500)', boxShadow: 'var(--shadow-sm)' }}
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
          {hasNodes ? (
            // 스트리밍: 노드 기반 렌더링
            <div className="space-y-3">
              {nodes.map((node, idx) => (
                <StreamNodeView
                  key={node.id}
                  node={node}
                  showCursor={isStreaming && idx === nodes.length - 1}
                />
              ))}
            </div>
          ) : (
            // 히스토리: ReactMarkdown 렌더링
            <>
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
                {processedContent}
              </ReactMarkdown>
              {isStreaming && (
                <span
                  className="inline-block w-2 h-4 ml-1 rounded-sm align-middle animate-pulse"
                  style={{ background: 'var(--primary-500)' }}
                />
              )}
            </>
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