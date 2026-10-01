import { cachedGet, invalidateCache, request, SellerApiError } from '@/src/services/http';
import { queueOperation } from '@/src/services/offline-sync';
import type { Product } from '@/src/types';

export type ProductQuery = { q?: string; status?: string; sort?: string };
export type ProductInput = Partial<Product> & { name: string };

function queryString(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status && query.status !== 'all') params.set('status', query.status);
  if (query.sort) params.set('sort', query.sort);
  const value = params.toString();
  return value ? `?${value}` : '';
}

async function invalidateProductData() {
  await Promise.all([invalidateCache('products'), invalidateCache('overview')]);
}

export const productService = {
  async list(query: ProductQuery = {}, force = false) {
    const key = `products:${query.q || ''}:${query.status || 'all'}:${query.sort || 'newest'}`;
    return cachedGet<{ products: Product[]; serverTime: number }>(key, `/api/seller/products${queryString(query)}`, { force, maxAgeMs: 60_000 });
  },

  async get(id: string, force = false) {
    const result = await productService.list({}, force);
    const product = result.data.products.find(item => item.id === id);
    if (!product) throw new Error('Product not found.');
    return { ...result, data: product };
  },

  async create(values: ProductInput) {
    try {
      const result = await request<{ success: true; product: Product }>('/api/seller/products', { method: 'POST', body: JSON.stringify(values) });
      await invalidateProductData();
      return { ...result, queued: false };
    } catch (error) {
      if (error instanceof SellerApiError && error.offline) {
        const operation = await queueOperation({ entity: 'product', action: 'create', path: '/api/seller/products', method: 'POST', payload: values as Record<string, unknown> });
        return { success: true as const, product: { id: `offline-${operation.id}`, ...values, status: values.status || 'draft' } as Product, queued: true };
      }
      throw error;
    }
  },

  async update(id: string, values: Partial<Product>) {
    const payload = { id, ...values, expectedVersion: values.version };
    try {
      const result = await request<{ success: true; product: Product }>('/api/seller/products', { method: 'PATCH', body: JSON.stringify(payload) });
      await invalidateProductData();
      return { ...result, queued: false };
    } catch (error) {
      if (error instanceof SellerApiError && error.offline) {
        await queueOperation({ entity: 'product', action: 'update', path: '/api/seller/products', method: 'PATCH', payload: payload as Record<string, unknown> });
        return { success: true as const, product: { id, ...values } as Product, queued: true };
      }
      throw error;
    }
  },

  archive: (product: Product) => productService.update(product.id, { ...product, status: 'archived' }),

  duplicate: (product: Product) => productService.create({
    ...product,
    id: undefined,
    version: undefined,
    name: `${product.name} Copy`,
    sku: product.sku ? `${product.sku}-COPY` : '',
    status: 'draft',
    createdAt: undefined,
    updatedAt: undefined,
  }),

  async remove(id: string) {
    try {
      await request(`/api/seller/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await invalidateProductData();
      return { success: true as const, queued: false };
    } catch (error) {
      if (error instanceof SellerApiError && error.offline) {
        await queueOperation({ entity: 'product', action: 'delete', path: `/api/seller/products?id=${encodeURIComponent(id)}`, method: 'DELETE' });
        return { success: true as const, queued: true };
      }
      throw error;
    }
  },
};
