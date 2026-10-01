import { auth } from '@/src/lib/firebase';
import { API_URL, cachedGet, invalidateCache, request, SellerApiError } from '@/src/services/http';
import type { Catalog } from '@/src/types';

export type CatalogUploadAsset = { uri: string; name: string; mimeType?: string | null; size?: number | null };

function uploadRequest(form: FormData, token: string, onProgress?: (progress: number) => void) {
  return new Promise<{ success: true; catalog: Catalog }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/seller/catalogs`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 120000;
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = event => {
        if (event.lengthComputable && event.total > 0) onProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
      };
    }
    xhr.onerror = () => reject(new SellerApiError('Catalog uploads require an internet connection.', { offline: true }));
    xhr.ontimeout = () => reject(new SellerApiError('The catalog upload took too long. Please retry.'));
    xhr.onload = () => {
      let body: any = {};
      try { body = JSON.parse(xhr.responseText || '{}'); } catch {}
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new SellerApiError(body?.error || 'Unable to upload this catalog.', { status: xhr.status }));
        return;
      }
      onProgress?.(100);
      resolve(body as { success: true; catalog: Catalog });
    };
    xhr.send(form);
  });
}

export const catalogService = {
  list: (force = false) => cachedGet<{ catalogs: Catalog[]; serverTime: number }>('catalogs', '/api/seller/catalogs', { force, maxAgeMs: 60_000 }),

  async upload(asset: CatalogUploadAsset, values: { name?: string; supplier?: string; description?: string } = {}, onProgress?: (progress: number) => void) {
    const user = auth.currentUser;
    if (!user) throw new SellerApiError('Your seller session has expired. Please sign in again.', { status: 401 });
    const token = await user.getIdToken();
    const form = new FormData();
    form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' } as any);
    if (values.name) form.append('name', values.name);
    if (values.supplier) form.append('supplier', values.supplier);
    if (values.description) form.append('description', values.description);
    const body = await uploadRequest(form, token, onProgress);
    await Promise.all([invalidateCache('catalogs'), invalidateCache('overview')]);
    return body;
  },

  async remove(id: string) {
    const result = await request<{ success: true }>(`/api/seller/catalogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await Promise.all([invalidateCache('catalogs'), invalidateCache('overview')]);
    return result;
  },
};
