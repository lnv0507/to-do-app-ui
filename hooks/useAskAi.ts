import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';

interface AskAiRequest {
  prompt: string;
}

interface AskAiResponse {
  response: string;
}

export const useAskAi = () => {
  return useMutation({
    mutationFn: async (payload: AskAiRequest) => {
      const { data } = await apiClient.post<AskAiResponse>('/ai/ask', payload);
      return data;
    },
  });
};
