'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useChatStore } from '@/store';
import { conversationService } from '@/services';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const setConversationId = useChatStore((s) => s.setConversationId);
  const clearMessages     = useChatStore((s) => s.clearMessages);
  const setConversation   = useChatStore((s) => s.setConversation);
  const setLoading        = useChatStore((s) => s.setLoading);
  const setError          = useChatStore((s) => s.setError);
  const setSidebarOpen    = useChatStore((s) => s.setSidebarOpen);
  const resetChat         = useChatStore((s) => s.resetChat);

  useEffect(() => {
    if (!conversationId) return;

    // 'new' 모드: 빈 화면만, API 호출 없음
    if (conversationId === 'new') {
      setConversationId('new');
      clearMessages();
      return;
    }

    // /chat/new에서 막 전환된 경우: store에 이미 해당 ID의 메시지가 있으면 스킵
    const snap = useChatStore.getState();
    const isJustCreated = snap.conversationId === conversationId && snap.messages.length > 0;
    if (isJustCreated) return;

    // 일반 대화방 진입: 이전 메시지 초기화 후 히스토리 로드
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

  const handleNewConversation = () => {
    resetChat();
    router.push('/chat/new');
  };

  if (!conversationId) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 액션바 */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--neutral-100)',
          boxShadow: 'var(--shadow-xs)',
          paddingInlineStart: '16px',
          paddingInlineEnd: '12px',
          height: '52px',
        }}
      >
        {/* 햄버거 — icon button (40×40) */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="대화 목록 열기"
          className="cds-btn cds-btn--icon cds-btn--ghost"
        >
          <span className="flex flex-col gap-[5px] items-center justify-center">
            <span className="block w-[18px] h-[1.5px] rounded-full" style={{ background: 'currentColor' }} />
            <span className="block w-[18px] h-[1.5px] rounded-full" style={{ background: 'currentColor' }} />
            <span className="block w-[18px] h-[1.5px] rounded-full" style={{ background: 'currentColor' }} />
          </span>
        </button>

        {/* 새로운 분석 — button-md */}
        <button
          onClick={handleNewConversation}
          className="cds-btn cds-btn--md"
          style={{
            background: 'var(--white)',
            color: 'var(--neutral-700)',
            border: '1px solid var(--neutral-200)',
            boxShadow: 'var(--shadow-xs)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--white)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          새 채팅
        </button>
      </div>

      {/* 채팅 컨테이너 */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ChatContainer conversationId={conversationId} />
      </div>
    </div>
  );
}
