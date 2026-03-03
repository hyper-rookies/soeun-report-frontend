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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.length > UI_CONFIG.MESSAGE_MAX_LENGTH) return;

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
    <div className="w-full bg-[var(--surface-canvas)] border-t border-[var(--border-faint)] px-4 sm:px-8 pb-6 pt-4 flex flex-col items-center">
      {/* 💡 핵심 픽스: 채팅창과 동일하게 max-w-[800px] 적용 */}
      <form onSubmit={handleSend} className="w-full max-w-[800px] relative">
        
        <div className="flex items-center gap-3 bg-[var(--surface-well)] border border-[var(--border-strong)] rounded-2xl px-5 py-3 focus-within:bg-white focus-within:border-[var(--accent-default)] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="광고 성과에 대해 궁금한 점을 질문해 보세요."
            disabled={disabled || isLoading}
            className="flex-1 min-h-[24px] max-h-[150px] bg-transparent text-[15px] text-[var(--text-ink)] placeholder:text-[var(--text-ghost)] resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            rows={1}
            maxLength={UI_CONFIG.MESSAGE_MAX_LENGTH}
          />

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all ${
              isButtonDisabled
                ? 'bg-[var(--surface-canvas)] text-[var(--text-ghost)] cursor-not-allowed'
                : 'bg-[var(--accent-default)] text-white hover:bg-[var(--accent-dark)] active:scale-95'
            }`}
          >
            {isSending ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="text-[12px] text-gray-400 mt-3 text-center">
          AI 리포트는 부정확한 내용이 있을 수 있습니다. 주요 수치는 광고 대시보드를 직접 확인해 주세요.
        </div>
      </form>
    </div>
  );
};

export default ChatInput;