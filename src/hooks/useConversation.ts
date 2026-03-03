import { useCallback } from 'react';
import { useChatStore } from '@/store';
import { conversationService } from '@/services';
import { Conversation } from '@/types/chat';

/**
 * 대화 생성, 로드, 관리 훅
 */
export const useConversation = () => {
  const store = useChatStore();

  /**
   * 새 대화 생성
   */
  const createConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      store.setLoading(true);
      store.setError(null);

      const conversation = await conversationService.createConversation();
      store.setConversation(conversation);

      return conversation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '대화 생성 실패';
      store.setError(errorMessage);
      return null;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

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
        const errorMessage = error instanceof Error ? error.message : '대화 로드 실패';
        store.setError(errorMessage);
        return null;
      } finally {
        store.setLoading(false);
      }
    },
    [store]
  );

  /**
   * 모든 대화 조회
   */
  const listConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      store.setLoading(true);
      store.setError(null);

      const conversations = await conversationService.listConversations();
      return conversations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '대화 목록 조회 실패';
      store.setError(errorMessage);
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
