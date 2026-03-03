import apiClient from './api';
import { Conversation } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

/**
 * Conversation 서비스
 */
export const conversationService = {
  /**
   * 모든 대화 조회
   */
  listConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>(API_ENDPOINTS.CONVERSATION.LIST);
    return response.data;
  },

  /**
   * 특정 대화 조회
   */
  getConversation: async (id: string): Promise<Conversation> => {
    const response = await apiClient.get<Conversation>(
      API_ENDPOINTS.CONVERSATION.GET(id)
    );
    return response.data;
  },

  /**
   * 새 대화 생성
   */
  createConversation: async (): Promise<Conversation> => {
    const response = await apiClient.post<Conversation>(
      API_ENDPOINTS.CONVERSATION.CREATE
    );
    return response.data;
  },

  /**
   * 대화 삭제
   */
  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CONVERSATION.GET(id));
  },
};

export default conversationService;
