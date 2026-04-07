import { create } from 'zustand';
import { Message } from '@/types/chat';

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  addMessage: (message: Message) => void;
  toggleChat: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  clearMessages: () => set({ messages: [] }),
}));
