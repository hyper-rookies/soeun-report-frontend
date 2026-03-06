'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useChatStore } from '@/store';
import { apiClient, conversationService } from '@/services';
import { API_ENDPOINTS } from '@/utils/constants';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params.conversationId as string;
  const presetValue = searchParams.get('preset') ?? undefined;

  const setConversationId = useChatStore((s) => s.setConversationId);
  const clearMessages     = useChatStore((s) => s.clearMessages);
  const setConversation   = useChatStore((s) => s.setConversation);
  const setLoading        = useChatStore((s) => s.setLoading);
  const setError          = useChatStore((s) => s.setError);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    if (conversationId === 'new') {
      setConversationId('new');
      clearMessages();
      return;
    }

    const snap = useChatStore.getState();
    const isJustCreated = snap.conversationId === conversationId && snap.messages.length > 0;
    if (isJustCreated) return;

    setConversationId(conversationId);
    clearMessages();
    setLoading(true);
    setError(null);

    let cancelled = false;

    conversationService
      .getConversation(conversationId)
      .then((conv) => {
        if (!cancelled) setConversation(conv);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '대화를 불러올 수 없어요.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      setLoading(false);
    };
  }, [conversationId, setConversationId, clearMessages, setConversation, setLoading, setError]);

  // 💡 상단 액션바(공유 버튼 포함)가 사라졌지만, 추후 다른 곳에서 
  // 공유 기능을 쓸 수 있도록 모달 로직과 핸들러는 안전하게 남겨두었습니다.
  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  if (!conversationId) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--white)] relative">
      
      {/* 액션바 영역(shrink-0 flex items-center justify-end...) 전체 삭제 완료! */}

      {/* 채팅 컨테이너 */}
      <div className="flex-1 overflow-hidden relative">
        <ChatContainer conversationId={conversationId} presetValue={presetValue} />
      </div>

      {/* 제미나이 스타일 공유 모달 (현재는 띄울 버튼이 없지만 기능은 유지) */}
      {shareModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: 3000, background: 'rgba(0, 0, 0, 0.5)' }} 
          onClick={() => setShareModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-[460px] rounded-2xl flex flex-col gap-6"
            style={{ 
              background: 'var(--white)', 
              boxShadow: 'var(--shadow-2xl)',
              padding: '32px' 
            }}
          >
            {/* 헤더 & 닫기 버튼 */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[20px] font-bold tracking-tight mb-2" style={{ color: 'var(--text-ink)' }}>
                  채팅 공유
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  이 링크를 가진 모든 사람이 이 대화를 볼 수 있습니다.<br/>
                  (링크는 30일간 유효합니다)
                </p>
              </div>
              <button 
                onClick={() => setShareModalOpen(false)}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-ghost)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--surface-canvas)';
                  e.currentTarget.style.color = 'var(--text-ink)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-ghost)';
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 링크 복사 영역 */}
            <div 
              className="flex items-center justify-between rounded-xl p-4"
              style={{ 
                background: 'var(--surface-canvas)', 
                border: '1px solid var(--border-default)' 
              }}
            >
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent border-none outline-none text-[15px] mr-4"
                style={{ color: 'var(--text-ink)' }}
                onClick={(e) => e.currentTarget.select()} 
              />
              
              <button
                onClick={handleCopyLink}
                title="링크 복사"
                className="shrink-0 p-3 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                style={{ 
                  background: isCopied ? 'var(--primary-50)' : 'var(--white)', 
                  border: '1px solid',
                  borderColor: isCopied ? 'var(--primary-200)' : 'var(--border-strong)',
                  color: isCopied ? 'var(--primary-500)' : 'var(--text-ink)' 
                }}
              >
                {isCopied ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}