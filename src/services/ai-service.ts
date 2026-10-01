import { request } from '@/src/services/http';
import type { AIConversation, AIMessage } from '@/src/types';

export const aiService = {
  listConversations: () => request<{ conversations: AIConversation[] }>('/api/seller/intelligence'),
  conversation: (id: string) => request<{ conversation: AIConversation }>(`/api/seller/intelligence?id=${encodeURIComponent(id)}`),
  ask: (messages: AIMessage[], conversationId?: string, signal?: AbortSignal) =>
    request<{ success: true; conversationId: string; response: string; contextUpdatedAt: number }>('/api/seller/intelligence', {
      method: 'POST',
      body: JSON.stringify({ messages, conversationId }),
      signal,
    }),
  rename: (id: string, title: string) => request<{ success: true }>('/api/seller/intelligence', {
    method: 'PATCH',
    body: JSON.stringify({ id, title }),
  }),
  remove: (id: string) => request<{ success: true }>(`/api/seller/intelligence?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
