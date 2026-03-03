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

  // 페이지 로드 시 conversationId 설정
  useEffect(() => {
    if (conversationId) {
      setConversationId(conversationId);
    }
  }, [conversationId, setConversationId]);

  // 유효한 conversationId 없으면 메인으로 리다이렉트
  if (!conversationId) {
    router.push('/');
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            대화 ID: {conversationId.slice(0, 8)}...
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            광고 데이터를 자연어로 분석하세요
          </p>
        </div>

        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← 메인으로
        </button>
      </div>

      {/* 채팅 컨테이너 */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer conversationId={conversationId} />
      </div>
    </div>
  );
}
