'use client';

import { useRouter } from 'next/navigation';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { useChatStore } from '@/store';

/**
 * 레이아웃용 사이드바 — 스토어 상태를 직접 구독하는 connected 컴포넌트
 */
export const Sidebar = () => {
  const router = useRouter();
  const sidebarOpen      = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen   = useChatStore((s) => s.setSidebarOpen);
  const conversationId   = useChatStore((s) => s.conversationId);

  const handleNewConversation = async () => {
    setSidebarOpen(false);
    router.push('/chat/new'); // API 호출 없이 새 대화 화면으로 이동
  };

  return (
    <ConversationSidebar
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      currentConversationId={conversationId ?? ''}
      onNewConversation={handleNewConversation}
    />
  );
};

export default Sidebar;
