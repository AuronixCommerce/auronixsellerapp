import { auth } from '@/src/lib/firebase';
import { API_URL, cachedGet, invalidateCache, request, SellerApiError } from '@/src/services/http';
import type { Catalog } from '@/src/types';

export type CatalogUploadAsset = { uri: string; name: string; mimeType?: string | null; size?: number | null };

export const catalogService = {
  list: (force = false) => cachedGet<{ catalogs: Catalog[]; serverTime: number }>('catalogs', '/api/seller/catalogs', { force, maxAgeMs: 60_000 }),

  async upload(asset: CatalogUploadAsset, values: { name?: string; supplier?: string; description?: string } = {}) {
    const user = auth.currentUser;
    if (!user) throw new SellerApiError('Your seller session has expired. Please sign in again.', { status: 401 });
    const token = await user.getIdToken();
    const form = new FormData();
    form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' } as any);
    if (values.name) form.append('name', values.name);
    if (values.supplier) form.append('supplier', values.supplier);
    if (values.description) form.append('description', values.description);
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/seller/catalogs`, { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, body: form });
    } catch {
      throw new SellerApiError('Catalog uploads require an internet connection.', { offline: true });
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new SellerApiError(body?.error || 'Unable to upload this catalog.', { status: response.status });
    await Promise.all([invalidateCache('catalogs'), invalidateCache('overview')]);
    return body as { success: true; catalog: Catalog };
  },

  async remove(id: string) {
    const result = await request<{ success: true }>(`/api/seller/catalogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await Promise.all([invalidateCache('catalogs'), invalidateCache('overview')]);
    return result;
  },
};
