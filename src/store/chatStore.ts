import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatMessage, Conversation, ConversationSummary } from '@/types/chat';

/**
 * Chat Store State Interface
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
  toastMessage: string | null; // 🍎 추가: 토스트 메시지 상태

  // Actions
  setConversationId: (id: string) => void;
  setConversation: (conversation: Conversation) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setLastMessageData: (data: Record<string, unknown>[], chartType?: 'line' | 'bar' | 'pie' | 'table') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingComplete: (complete: boolean) => void;
  clearMessages: () => void;
  resetChat: () => void;

  // 대화 목록 Actions
  setConversations: (conversations: ConversationSummary[]) => void;
  addConversation: (conversation: ConversationSummary) => void;
  removeConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;

  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  setToast: (msg: string | null) => void; // 🍎 추가: 토스트 설정 액션
}

/**
 * Zustand Chat Store
 */
export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        // ── 초기 상태 ──────────────────────────────────────────────────
        conversationId: null,
        conversation: null,
        messages: [],
        isLoading: false,
        error: null,
        isStreamingComplete: false,
        conversations: [],
        sidebarOpen: false,
        toastMessage: null,

        // ── 대화 관련 Actions ──────────────────────────────────────────
        setConversationId: (id) => set({ conversationId: id }),

        setConversation: (conversation) =>
          set({
            conversation,
            conversationId: conversation.id,
            messages: conversation.messages,
          }),

        addMessage: (message) =>
          set((state) => ({ messages: [...state.messages, message] })),

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

        setLastMessageData: (data, chartType) =>
          set((state) => {
            const messages = [...state.messages];
            if (messages.length > 0) {
              const last = messages[messages.length - 1];
              messages[messages.length - 1] = {
                ...last,
                data,
                ...(chartType && { chartType }),
              };
            }
            return { messages };
          }),

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        setStreamingComplete: (complete) => set({ isStreamingComplete: complete }),

        clearMessages: () => set({ messages: [] }),

        resetChat: () =>
          set({
            conversationId: null,
            conversation: null,
            messages: [],
            isLoading: false,
            error: null,
            isStreamingComplete: false,
          }),

        // ── 대화 목록 Actions ──────────────────────────────────────────
        setConversations: (conversations) => set({ conversations }),

        addConversation: (conversation) =>
          set((state) => ({
            conversations: [conversation, ...state.conversations],
          })),

        removeConversation: (id) =>
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
          })),

        updateConversationTitle: (id, title) =>
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === id ? { ...c, title } : c
            ),
          })),

        // ── UI Actions ────────────────────────────────────────────────
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        setToast: (msg) => {
          set({ toastMessage: msg });
          // 3초 후 자동으로 토스트 제거
          if (msg) {
            setTimeout(() => {
              set({ toastMessage: null });
            }, 3000);
          }
        },
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          // 'new' 및 UI 일시적 상태(toastMessage 등)는 저장하지 않음
          conversationId: state.conversationId === 'new' ? null : state.conversationId,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
);

export default useChatStore;