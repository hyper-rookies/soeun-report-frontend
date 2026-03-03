'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { UI_CONFIG } from '@/utils/constants';

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * 메시지 입력 폼 컴포넌트
 */
export const ChatInput: FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (input.length > UI_CONFIG.MESSAGE_MAX_LENGTH) {
      alert(`메시지는 ${UI_CONFIG.MESSAGE_MAX_LENGTH}자 이하여야 합니다.`);
      return;
    }

    setIsSending(true);
    try {
      await onSend(input);
      setInput('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter: 줄바꿈, Enter: 전송
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const isButtonDisabled = disabled || isLoading || isSending || !input.trim();

  return (
    <form
      onSubmit={handleSend}
      className="border-t border-gray-200 bg-white p-4"
    >
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          disabled={disabled || isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
          maxLength={UI_CONFIG.MESSAGE_MAX_LENGTH}
        />

        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }`}
        >
          {isSending ? '전송 중...' : '전송'}
        </button>
      </div>

      {/* 문자 수 표시 */}
      <div className="text-xs text-gray-500 mt-2 text-right">
        {input.length} / {UI_CONFIG.MESSAGE_MAX_LENGTH}
      </div>
    </form>
  );
};

export default ChatInput;
