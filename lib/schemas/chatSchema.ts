import { z } from 'zod';

export const chatInputSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Vui lòng nhập nội dung tin nhắn.')
    .max(4000, 'Tin nhắn quá dài (tối đa 4000 ký tự).'),
});

export type ChatInputType = z.infer<typeof chatInputSchema>;
