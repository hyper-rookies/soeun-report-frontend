'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useChatStore } from '@/store';
import { ChatContainer } from '@/components/chat';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { setConversationId } = useChatStore();

  // 페이지 로드 시 상태 스토어에 conversationId 세팅
  useEffect(() => {
    if (conversationId) {
      setConversationId(conversationId);
    }
  }, [conversationId, setConversationId]);

  if (!conversationId) {
    router.push('/');
    return null;
  }

  return (
    /* 핵심 변경점: h-screen을 h-full로 변경하고 카드 형태의 테두리 및 둥근 모서리 적용 */
    <div className="h-full flex flex-col bg-[var(--surface-canvas)] border border-[var(--border-default)] rounded-[8px] overflow-hidden shadow-sm">
      
      {/* 헤더 */}
      <div className="border-b border-[var(--border-default)] bg-[var(--surface-elevated)] px-6 py-4 flex items-center justify-between">
        <div>
          {/* 숫자가 포함된 데이터는 tabular-nums 사용 */}
          <h2 className="text-[17px] font-semibold text-[var(--text-ink)] tracking-[-0.015em] tabular-nums">
            대화 ID: {conversationId.slice(0, 8)}...
          </h2>
          <p className="text-[13px] text-[var(--text-soft)] mt-1">
            광고 데이터를 자연어로 분석하세요
          </p>
        </div>

        {/* 뒤로가기 버튼: 둥글기를 6px로 조이고, hover 시 well 색상 사용 */}
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-[13px] font-medium text-[var(--text-dim)] hover:text-[var(--text-ink)] border border-[var(--border-default)] rounded-[6px] hover:bg-[var(--surface-well)] transition-colors"
        >
          ← 메인으로
        </button>
      </div>

      {/* 채팅 컨테이너 (주석 해제 완료) */}
      <div className="flex-1 overflow-hidden bg-[var(--surface-canvas)]">
        <ChatContainer conversationId={conversationId} />
      </div>
    </div>
  );
}