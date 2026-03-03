'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useChatStore } from '@/store';
import { useConversation } from '@/hooks/useConversation';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { setConversationId, resetChat } = useChatStore();
  const { createConversation } = useConversation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (conversationId) {
      setConversationId(conversationId);
    }
  }, [conversationId, setConversationId]);

  const handleNewConversation = async () => {
    resetChat();
    const conversation = await createConversation();
    if (conversation) {
      router.push(`/chat/${conversation.id}`);
    } else {
      router.push('/');
    }
  };

  if (!conversationId) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 액션바 — 좌: 햄버거, 우: 새로운 분석 */}
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--surface-elevated)] px-6 sm:px-8 py-2.5 flex items-center justify-between">
        {/* 햄버거 버튼 */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="대화 목록 열기"
          className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-md text-[var(--text-soft)] hover:text-[var(--text-ink)] hover:bg-[var(--surface-well)] transition-colors"
        >
          <span className="w-[18px] h-px bg-current rounded-full" />
          <span className="w-[18px] h-px bg-current rounded-full" />
          <span className="w-[18px] h-px bg-current rounded-full" />
        </button>

        {/* 새로운 분석 버튼 */}
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-dim)] hover:text-[var(--text-ink)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-well)] rounded-md transition-colors border border-[var(--border-default)]"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          새로운 분석
        </button>
      </div>

      {/* 채팅 컨테이너 */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ChatContainer conversationId={conversationId} />
      </div>

      {/* 대화 목록 사이드바 드로어 */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={conversationId}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}
