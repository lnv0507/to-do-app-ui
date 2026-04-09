import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface ChatMessageAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessageArea({ messages, isLoading }: ChatMessageAreaProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Automatically scroll down when there are new messages or while loading
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-3">
          <Bot className="w-12 h-12" />
          <p className="text-sm">Start chatting with your AI!</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex w-max max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-2 text-sm',
              msg.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground rounded-br-none'
                : 'bg-muted rounded-bl-none'
            )}
          >
            {/* Render line breaks if present (whitespace-pre-wrap) */}
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          </div>
        ))
      )}

      {isLoading && (
        <div className="flex w-max max-w-[85%] bg-muted rounded-2xl rounded-bl-none px-4 py-3 text-sm">
          <span className="flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:0.4s]" />
          </span>
        </div>
      )}

      <div ref={endOfMessagesRef} />
    </div>
  );
}
