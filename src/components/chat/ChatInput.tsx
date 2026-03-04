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
  const [isFocused, setIsFocused] = useState(false);
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

  const containerStyle: React.CSSProperties = {
    background: 'var(--neutral-50)',
    borderTop: '1px solid var(--neutral-100)',
    padding: '16px 16px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  };

  const inputBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--white)',
    border: `1px solid ${isFocused ? 'var(--primary-500)' : 'var(--neutral-200)'}`,
    borderRadius: '16px',
    padding: '12px 12px 12px 20px',
    boxShadow: isFocused ? 'var(--focus-ring-primary)' : 'var(--shadow-xs)',
    transition: 'border-color 0.1s ease-in-out, box-shadow 0.1s ease-in-out',
    width: '100%',
  };

  const sendBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
    background: isButtonDisabled ? 'var(--neutral-100)' : 'var(--primary-500)',
    color: isButtonDisabled ? 'var(--neutral-300)' : 'var(--white)',
    flexShrink: 0,
    transition: 'background-color 0.1s ease-in-out',
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSend} style={{ width: '100%', maxWidth: '768px' }}>
        <div style={inputBoxStyle}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="오늘은 어떤 도움을 드릴까요?"
            disabled={disabled || isLoading}
            className="flex-1 bg-transparent resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            style={{
              minHeight: '24px',
              maxHeight: '150px',
              fontSize: '15px',
              color: 'var(--neutral-700)',
              lineHeight: '1.6',
            }}
            rows={1}
            maxLength={UI_CONFIG.MESSAGE_MAX_LENGTH}
          />

          <button
            type="submit"
            disabled={isButtonDisabled}
            style={sendBtnStyle}
            onMouseOver={(e) => {
              if (!isButtonDisabled) e.currentTarget.style.background = 'var(--primary-450)';
            }}
            onMouseOut={(e) => {
              if (!isButtonDisabled) e.currentTarget.style.background = 'var(--primary-500)';
            }}
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

        <p
          className="text-[11px] mt-2 text-center"
          style={{ color: 'var(--neutral-300)' }}
        >
          AI 리포트는 부정확한 내용이 있을 수 있어요. 중요한 수치는 광고 대시보드를 직접 확인해 주세요.
        </p>
      </form>
    </div>
  );
};

export default ChatInput;
