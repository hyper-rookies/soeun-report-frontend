'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useChatStore } from '@/store';
import { apiClient, conversationService } from '@/services';
import { API_ENDPOINTS } from '@/utils/constants';
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

  const handleShare = async () => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.SHARE.CREATE(conversationId));
      const { shareUrl } = res.data.data ?? res.data;
      await navigator.clipboard.writeText(shareUrl);
      alert('공유 링크가 클립보드에 복사되었습니다!\n만료: 30일');
    } catch {
      alert('공유 링크 생성에 실패했습니다.');
    }
  };


  if (!conversationId) return null;

  return (
    // 1. 전체 높이를 꽉 채우고(h-full), 위에서부터 아래로 차곡차곡 쌓이게(flex-col) 설정
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--white)]">
      
      {/* 2. 액션바 (햄버거 & 새 채팅 버튼) */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--neutral-100)',
          boxShadow: 'var(--shadow-xs)',
          paddingInlineStart: '16px',
          paddingInlineEnd: '12px',
          height: '52px',
          zIndex: 10, // 채팅 내용이 스크롤될 때 띠 위로 올라오지 않게 방어
        }}
      >
        {/* 햄버거 — icon button */}
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

        <div className="flex items-center gap-2">
          {/* 공유 버튼 (new가 아닐 때만) */}
          {conversationId !== 'new' && (
            <button
              onClick={handleShare}
              title="공유 링크 생성"
              aria-label="공유 링크 생성"
              className="cds-btn cds-btn--icon cds-btn--ghost"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          )}

          {/* 새로운 분석 (새 채팅) */}
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
      </div>

      {/* 3. 채팅 컨테이너 영역: 남은 공간을 모두 차지하도록(flex-1) */}
      <div className="flex-1 overflow-hidden relative">
        <ChatContainer conversationId={conversationId} />
      </div>
    </div>
  );
}