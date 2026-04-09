import { z } from 'zod';

export const chatInputSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Please enter a message content.')
    .max(4000, 'Message is too long (maximum 4000 characters).'),
});

export type ChatInputType = z.infer<typeof chatInputSchema>;
