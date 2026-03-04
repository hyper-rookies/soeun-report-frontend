import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatMessage, Conversation, ConversationSummary } from '@/types/chat';

/**
 * Chat Store State
 */
export interface ChatState {
  // 현재 대화 상태
  conversationId: string | null;
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isStreamingComplete: boolean;

  // 대화 목록
  conversations: ConversationSummary[];

  // UI 상태
  sidebarOpen: boolean;

  // Actions
  setConversationId: (id: string) => void;
  setConversation: (conversation: Conversation) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setLastMessageData: (data: Record<string, unknown>[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingComplete: (complete: boolean) => void;
  clearMessages: () => void;
  resetChat: () => void;

  // 대화 목록 Actions
  setConversations: (conversations: ConversationSummary[]) => void;
  addConversation: (conversation: ConversationSummary) => void;
  removeConversation: (id: string) => void;

  // UI Actions
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Zustand Chat Store
 * - devtools: Redux DevTools 연동
 * - persist: localStorage에 저장
 */
export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        // 초기 상태
        conversationId: null,
        conversation: null,
        messages: [],
        isLoading: false,
        error: null,
        isStreamingComplete: false,
        conversations: [],
        sidebarOpen: false,

        // 대화 ID 설정
        setConversationId: (id) => set({ conversationId: id }),

        // 전체 대화 설정
        setConversation: (conversation) =>
          set({
            conversation,
            conversationId: conversation.id,
            messages: conversation.messages,
          }),

        // 메시지 추가
        addMessage: (message) =>
          set((state) => ({ messages: [...state.messages, message] })),

        // 마지막 메시지에 텍스트 추가 (스트리밍용)
        appendToLastMessage: (text) =>
          set((state) => {
            const messages = [...state.messages];
            if (messages.length > 0) {
              const last = messages[messages.length - 1];
              messages[messages.length - 1] = {
                ...last,
                content: last.content + text,
              };
            }
            return { messages };
          }),

        // 마지막 메시지에 구조 데이터 설정 (SSE "data" 이벤트용)
        setLastMessageData: (data) =>
          set((state) => {
            const messages = [...state.messages];
            if (messages.length > 0) {
              const last = messages[messages.length - 1];
              messages[messages.length - 1] = { ...last, data };
            }
            return { messages };
          }),

        // 로딩 상태 설정
        setLoading: (loading) => set({ isLoading: loading }),

        // 에러 설정
        setError: (error) => set({ error }),

        // 스트리밍 완료 상태
        setStreamingComplete: (complete) => set({ isStreamingComplete: complete }),

        // 메시지 초기화
        clearMessages: () => set({ messages: [] }),

        // 전체 채팅 초기화
        resetChat: () =>
          set({
            conversationId: null,
            conversation: null,
            messages: [],
            isLoading: false,
            error: null,
            isStreamingComplete: false,
          }),

        // 대화 목록 설정
        setConversations: (conversations) => set({ conversations }),

        // 대화 추가 (목록 맨 앞에 삽입)
        addConversation: (conversation) =>
          set((state) => ({
            conversations: [conversation, ...state.conversations],
          })),

        // 대화 제거
        removeConversation: (id) =>
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
          })),

        // 사이드바 열기/닫기
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
      }),
      {
        name: 'chat-store',
        // localStorage에 저장할 상태만 지정
        partialize: (state) => ({
          // 'new'는 임시 상태이므로 localStorage에 저장하지 않음
          conversationId: state.conversationId === 'new' ? null : state.conversationId,
          messages: state.messages,
        }),
      }
    )
  )
);

export default useChatStore;
