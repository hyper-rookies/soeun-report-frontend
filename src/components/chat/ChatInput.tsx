'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { UI_CONFIG } from '@/utils/constants';

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput: FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const isButtonDisabled = disabled || isLoading || isSending || !input.trim();

  return (
    // px-6 py-5로 여백을 시원하게 늘림
    <div className="border-t border-[var(--border-default)] bg-[var(--surface-elevated)] px-6 py-5">
      {/* w-full을 추가하여 가로 사이즈 꽉 채우기 */}
      <form onSubmit={handleSend} className="w-full max-w-4xl mx-auto flex flex-col">
        <div className="flex gap-4 items-end w-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="분석할 내용을 입력하세요... (Shift+Enter로 줄바꿈)"
            disabled={disabled || isLoading}
            className="flex-1 w-full px-4 py-3 text-[14px] text-[var(--text-ink)] placeholder-[var(--text-ghost)] bg-[var(--surface-well)] border border-[var(--border-default)] rounded-[8px] resize-none focus:outline-none focus:border-[var(--accent-default)] focus:ring-1 focus:ring-[var(--accent-default)] disabled:opacity-60 disabled:cursor-not-allowed transition-shadow"
            rows={1}
            maxLength={UI_CONFIG.MESSAGE_MAX_LENGTH}
          />

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`h-[46px] px-8 rounded-[6px] text-[13px] font-semibold transition-colors shrink-0 ${
              isButtonDisabled
                ? 'bg-[var(--surface-canvas)] text-[var(--text-ghost)] border border-[var(--border-default)] cursor-not-allowed'
                : 'bg-[var(--accent-default)] text-[var(--accent-text)] hover:bg-[var(--accent-dark)] active:bg-[var(--accent-deeper)] shadow-sm'
            }`}
          >
            {isSending ? '전송 중...' : '전송'}
          </button>
        </div>

        <div className="text-[11px] text-[var(--text-soft)] mt-2 text-right font-mono">
          {input.length} / {UI_CONFIG.MESSAGE_MAX_LENGTH}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;