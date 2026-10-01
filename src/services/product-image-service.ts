import * as ImagePicker from 'expo-image-picker';
import { auth } from '@/src/lib/firebase';
import { API_URL, invalidateCache, request, SellerApiError } from '@/src/services/http';

export type ProductImage = {
  id: string;
  fileName: string;
  contentType?: string;
  size?: number;
  createdAt?: number;
};

export const productImageService = {
  async pick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Photo library access is required to add product images.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName || `product-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      size: asset.fileSize,
    };
  },

  async list(productId: string) {
    return request<{ images: ProductImage[] }>(`/api/seller/products/images?productId=${encodeURIComponent(productId)}`);
  },

  async upload(productId: string, asset: { uri: string; name: string; mimeType?: string | null }, onProgress?: (value: number) => void) {
    const user = auth.currentUser;
    if (!user) throw new SellerApiError('Your seller session has expired. Please sign in again.', { status: 401 });
    const token = await user.getIdToken();
    const form = new FormData();
    form.append('productId', productId);
    form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'image/jpeg' } as any);
    const result = await new Promise<{ success: true; image: ProductImage }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/seller/products/images`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 90000;
      xhr.upload.onprogress = event => {
        if (event.lengthComputable && event.total > 0) onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      };
      xhr.onerror = () => reject(new SellerApiError('Product image upload requires an internet connection.', { offline: true }));
      xhr.ontimeout = () => reject(new Error('The image upload took too long. Please retry.'));
      xhr.onload = () => {
        let body: any = {};
        try { body = JSON.parse(xhr.responseText || '{}'); } catch {}
        if (xhr.status < 200 || xhr.status >= 300) return reject(new SellerApiError(body?.error || 'Unable to upload product image.', { status: xhr.status }));
        onProgress?.(100);
        resolve(body);
      };
      xhr.send(form);
    });
    await Promise.all([invalidateCache('products'), invalidateCache('overview')]);
    return result;
  },

  async remove(productId: string, imageId: string) {
    await request(`/api/seller/products/images?productId=${encodeURIComponent(productId)}&imageId=${encodeURIComponent(imageId)}`, { method: 'DELETE' });
    await Promise.all([invalidateCache('products'), invalidateCache('overview')]);
  },

  async source(productId: string, imageId: string) {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      uri: `${API_URL}/api/seller/products/images?productId=${encodeURIComponent(productId)}&imageId=${encodeURIComponent(imageId)}`,
      headers: { Authorization: `Bearer ${token}` },
    };
  },
};
