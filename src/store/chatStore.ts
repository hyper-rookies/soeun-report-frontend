import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatMessage, Conversation } from '@/types/chat';

/**
 * Chat Store State
 */
export interface ChatState {
  // 상태
  conversationId: string | null;
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isStreamingComplete: boolean;

  // Actions
  setConversationId: (id: string) => void;
  setConversation: (conversation: Conversation) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingComplete: (complete: boolean) => void;
  clearMessages: () => void;
  resetChat: () => void;
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

        // 대화 ID 설정
        setConversationId: (id: string) => {
          set({ conversationId: id });
        },

        // 전체 대화 설정
        setConversation: (conversation: Conversation) => {
          set({
            conversation,
            conversationId: conversation.id,
            messages: conversation.messages,
          });
        },

        // 메시지 추가
        addMessage: (message: ChatMessage) => {
          set((state) => ({
            messages: [...state.messages, message],
          }));
        },

        // 마지막 메시지에 텍스트 추가 (스트리밍용)
        appendToLastMessage: (text: string) => {
          set((state) => {
            const messages = [...state.messages];
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              messages[messages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + text,
              };
            }
            return { messages };
          });
        },

        // 로딩 상태 설정
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // 에러 설정
        setError: (error: string | null) => {
          set({ error });
        },

        // 스트리밍 완료 상태
        setStreamingComplete: (complete: boolean) => {
          set({ isStreamingComplete: complete });
        },

        // 메시지 초기화
        clearMessages: () => {
          set({ messages: [] });
        },

        // 전체 채팅 초기화
        resetChat: () => {
          set({
            conversationId: null,
            conversation: null,
            messages: [],
            isLoading: false,
            error: null,
            isStreamingComplete: false,
          });
        },
      }),
      {
        name: 'chat-store',
        // localStorage에 저장할 상태 지정
        partialize: (state) => ({
          conversationId: state.conversationId,
          messages: state.messages,
        }),
      }
    )
  )
);

export default useChatStore;
