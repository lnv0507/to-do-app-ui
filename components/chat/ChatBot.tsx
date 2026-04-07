'use client';

import { useChatStore } from '@/hooks/useChatStore';
import { useAskAi } from '@/hooks/useAskAi';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ChatBot() {
  const { messages, isOpen, toggleChat, addMessage } = useChatStore();
  const { mutateAsync: askAi, isPending } = useAskAi();

  const handleSend = async (prompt: string) => {
    // 1. Lưu message của user
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      createdAt: new Date(),
    });

    // 2. Fetch API
    try {
      const data = await askAi({ prompt });
      // 3. Thêm response của AI vào store
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        createdAt: new Date(),
      });
    } catch (error) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Hãy thử lại.',
        createdAt: new Date(),
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Cửa sổ Chat */}
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border-border/40">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="font-semibold text-sm flex items-center gap-2">
               Todo AI Assistant
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-muted"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ChatMessageArea messages={messages} isLoading={isPending} />
          <ChatInput onSend={handleSend} isLoading={isPending} />
        </Card>
      )}

      {/* Nút Toggle */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-white bg-primary hover:bg-primary/90"
        onClick={toggleChat}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
