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

  let processedContent = message.content
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '');

  if (!isUser) {
    processedContent = processedContent
      .replace(/(📊|⚠️|🔍|📝)/g, '\n\n$1 ')
      .replace(/(###)\s*/g, '\n\n### ')
      .replace(/(\d+\.)(?![\d])/g, '\n$1 ')
      .replace(/(-\s*[가-힣a-zA-Z])/g, '\n$1 ');
  }

  // 유저 메시지 (제미나이 스타일: 우측 정렬, 넓은 패딩, 둥근 말풍선)
  if (isUser) {
    return (
      <div className="flex w-full justify-end mb-8">
        {/* 가로 너비 최대 85%로 제한 */}
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="px-6 py-4 bg-gray-100 rounded-[24px] rounded-tr-sm text-[15px] text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
            {processedContent}
          </div>
        </div>
      </div>
    );
  }

  // AI 메시지 (제미나이 스타일: 좌측 정렬, 말풍선 없이 아바타와 텍스트만)
  return (
    <div className="flex w-full justify-start mb-8 gap-4">
      {/* AI 아바타 아이콘 */}
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <span className="text-white text-[16px] leading-none">✨</span>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[15px] text-gray-800 leading-[1.8] tracking-[-0.01em] break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              h1: ({ children }) => <h1 className="text-[20px] font-bold mt-8 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-[18px] font-bold mt-6 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-[16px] font-bold mt-5 mb-2">{children}</h3>,
              table: ({ children }) => (
                <div className="overflow-x-auto mb-6 border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="px-4 py-3 bg-gray-50 text-left text-[13px] font-semibold text-gray-600">{children}</th>,
              td: ({ children }) => <td className="px-4 py-3 text-[14px] border-t border-gray-100">{children}</td>,
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[13.5px] font-mono text-indigo-600">
                  {children}
                </code>
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;