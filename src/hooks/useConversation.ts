import { useCallback } from 'react';
import { useChatStore } from '@/store';
import { conversationService } from '@/services';
import { Conversation, ConversationSummary } from '@/types/chat';

/**
 * 대화 생성, 로드, 관리 훅
 */
export const useConversation = () => {
  const store = useChatStore();

  /**
   * 새 대화 생성
   */
  const createConversation = useCallback(
    async (title = '새 대화'): Promise<ConversationSummary | null> => {
      try {
        store.setLoading(true);
        store.setError(null);

        const summary = await conversationService.createConversation(title);
        console.log('[useConversation] createConversation result:', summary);
        store.setConversationId(summary.id);
        store.clearMessages();
        store.addConversation(summary);

        return summary;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : '대화 생성 실패');
        return null;
      } finally {
        store.setLoading(false);
      }
    },
    [store]
  );

  /**
   * 기존 대화 로드
   */
  const loadConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      try {
        store.setLoading(true);
        store.setError(null);

        const conversation = await conversationService.getConversation(conversationId);
        store.setConversation(conversation);

        return conversation;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : '대화 로드 실패');
        return null;
      } finally {
        store.setLoading(false);
      }
    },
    [store]
  );

  /**
   * 대화 목록 조회 및 스토어 업데이트
   */
  const listConversations = useCallback(async (): Promise<ConversationSummary[]> => {
    try {
      store.setLoading(true);
      store.setError(null);

      const conversations = await conversationService.listConversations();
      store.setConversations(conversations);
      return conversations;
    } catch (error) {
      store.setError(error instanceof Error ? error.message : '대화 목록 조회 실패');
      return [];
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  /**
   * 현재 대화 초기화
   */
  const resetConversation = useCallback(() => {
    store.resetChat();
  }, [store]);

  return {
    // 데이터
    currentConversationId: store.conversationId,
    currentConversation: store.conversation,
    messages: store.messages,
    conversations: store.conversations,

    // 액션
    createConversation,
    loadConversation,
    listConversations,
    resetConversation,

    // 상태
    isLoading: store.isLoading,
    error: store.error,
  };
};

export default useConversation;
