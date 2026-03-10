import apiClient from '@/lib/axiosInstance';
import { Conversation, ConversationSummary } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

// ─── 응답 정규화 ───────────────────────────────────────────────────────────────

/**
 * 백엔드 응답 래퍼 { success, data } 를 벗긴다.
 * axios response.data 가 이미 한 겹이므로,
 * response.data = { success: true, data: {...} } 인 경우 .data 를 꺼낸다.
 */
function extractWrapper(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

/**
 * 단일 항목을 ConversationSummary 로 정규화한다.
 * - conversationId → id (백엔드 필드명 매핑)
 * - ISO 날짜 문자열 → Unix timestamp(ms), null → 0
 */
function normalizeItem(item: Record<string, unknown>): ConversationSummary {
  const toTs = (v: unknown): number =>
    v ? new Date(v as string).getTime() : 0;

  return {
    id: String(item.conversationId ?? item.id ?? ''),
    title: String(item.title ?? '새 대화'),
    createdAt: toTs(item.createdAt),
    updatedAt: toTs(item.updatedAt),
  };
}

// ─── 서비스 ────────────────────────────────────────────────────────────────────

export const conversationService = {
  /**
   * 대화 목록 조회
   * 응답: { success: true, data: [ { conversationId, title, updatedAt }, ... ] }
   */
  listConversations: async (page = 0, size = 20): Promise<ConversationSummary[]> => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CONVERSATION.LIST,
        { params: { page, size } }
      );
      console.log('[conversationService] listConversations raw:', response.data);
      const list = extractWrapper(response.data);
      if (!Array.isArray(list)) return [];
      return list.map((item) => normalizeItem(item as Record<string, unknown>));
    } catch (error) {
      throw error instanceof Error ? error : new Error('대화 목록 조회 실패');
    }
  },

  /**
   * 특정 대화 조회 (메시지 포함)
   */
  getConversation: async (id: string): Promise<Conversation> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CONVERSATION.GET(id));
      console.log('[conversationService] getConversation raw:', response.data);
      const raw = extractWrapper(response.data) as Record<string, unknown>;
      return {
        id: String(raw.conversationId ?? raw.id ?? ''),
        createdAt: raw.createdAt ? new Date(raw.createdAt as string).getTime() : 0,
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string).getTime() : 0,
        messages: (raw.messages as Conversation['messages']) ?? [],
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('대화 조회 실패');
    }
  },

  /**
   * 새 대화 생성
   * 응답: { success: true, data: { conversationId, title, updatedAt } }
   */
  createConversation: async (title: string): Promise<ConversationSummary> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CONVERSATION.CREATE,
        { title }
      );
      console.log('[conversationService] createConversation raw:', response.data);
      const item = extractWrapper(response.data);
      return normalizeItem(item as Record<string, unknown>);
    } catch (error) {
      throw error instanceof Error ? error : new Error('대화 생성 실패');
    }
  },

  /**
   * 대화 제목 수정
   */
  updateTitle: async (id: string, title: string): Promise<void> => {
    try {
      await apiClient.patch(API_ENDPOINTS.CONVERSATION.UPDATE_TITLE(id), { title });
    } catch (error) {
      throw error instanceof Error ? error : new Error('제목 수정 실패');
    }
  },

  /**
   * 대화 삭제
   */
  deleteConversation: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.CONVERSATION.GET(id));
    } catch (error) {
      throw error instanceof Error ? error : new Error('대화 삭제 실패');
    }
  },
};

/**
 * 리포트 Excel 내보내기
 * 응답: { success: true, data: { downloadUrl, fileName } }
 */
export const exportReportExcel = async (
  conversationId: string,
): Promise<{ downloadUrl: string; fileName: string }> => {
  const response = await apiClient.get(`/api/chat/report/${conversationId}/excel`);
  return (response.data as { data: { downloadUrl: string; fileName: string } }).data;
};

export default conversationService;
