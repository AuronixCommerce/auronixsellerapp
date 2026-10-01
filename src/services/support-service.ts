import { cachedGet, invalidateCache, request } from '@/src/services/http';
import type { SupportMessage, Ticket } from '@/src/types';

async function invalidateSupport() {
  await Promise.all([invalidateCache('support'), invalidateCache('overview')]);
}

export const supportService = {
  list: (force = false) => cachedGet<{ tickets: Ticket[] }>('support:tickets', '/api/seller/support', { force, maxAgeMs: 60_000 }),
  get: (id: string, force = false) => cachedGet<{ ticket: Ticket }>(`support:ticket:${id}`, `/api/seller/support?id=${encodeURIComponent(id)}`, { force, maxAgeMs: 30_000 }),
  async create(values: { subject: string; category: string; message: string; priority?: string }) {
    const result = await request<{ success: true; ticket: Ticket }>('/api/seller/support', { method: 'POST', body: JSON.stringify({ action: 'create', ...values }) });
    await invalidateSupport();
    return result;
  },
  async reply(id: string, message: string) {
    const result = await request<{ success: true; message: SupportMessage }>('/api/seller/support', { method: 'POST', body: JSON.stringify({ action: 'reply', id, message }) });
    await invalidateSupport();
    return result;
  },
  async rate(id: string, rating: number) {
    const result = await request<{ success: true; rating: number }>('/api/seller/support', { method: 'POST', body: JSON.stringify({ action: 'rate', id, rating }) });
    await invalidateSupport();
    return result;
  },
  async close(id: string) {
    const result = await request<{ success: true; status: string }>('/api/seller/support', { method: 'POST', body: JSON.stringify({ action: 'close', id }) });
    await invalidateSupport();
    return result;
  },
};
