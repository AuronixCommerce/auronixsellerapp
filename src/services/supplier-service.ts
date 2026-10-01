import { cachedGet, invalidateCache, request } from '@/src/services/http';
import type { Supplier } from '@/src/types';

export const supplierService = {
  list: (force = false) => cachedGet<{ suppliers: Supplier[] }>('suppliers', '/api/seller/suppliers', { force, maxAgeMs: 2 * 60_000 }),
  async create(values: Partial<Supplier> & { name: string }) { const result = await request<{ success: true; supplier: Supplier }>('/api/seller/suppliers', { method: 'POST', body: JSON.stringify(values) }); await invalidateCache('suppliers'); return result; },
  async update(id: string, values: Partial<Supplier>) { const result = await request<{ success: true; supplier: Supplier }>('/api/seller/suppliers', { method: 'PATCH', body: JSON.stringify({ id, ...values }) }); await invalidateCache('suppliers'); return result; },
  async remove(id: string) { const result = await request<{ success: true }>(`/api/seller/suppliers?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await invalidateCache('suppliers'); return result; },
};
