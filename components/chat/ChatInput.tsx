import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chatInputSchema, ChatInputType } from '@/lib/schemas/chatSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizonal } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const form = useForm<ChatInputType>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: { prompt: '' },
  });

  const onSubmit = (data: ChatInputType) => {
    onSend(data.prompt);
    form.reset();
  };

  return (
    <div className="p-3 border-t bg-background">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full items-center space-x-2"
      >
        <Input
          placeholder="Ask AI..."
          autoComplete="off"
          disabled={isLoading}
          {...form.register("prompt")}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
