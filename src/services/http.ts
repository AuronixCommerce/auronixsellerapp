import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/src/lib/firebase';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://www.auronixcommerce.com').replace(/\/$/, '');

export class SellerApiError extends Error {
  status?: number;
  code?: string;
  offline?: boolean;
  conflict?: boolean;

  constructor(message: string, options: Partial<SellerApiError> = {}) {
    super(message);
    Object.assign(this, options);
  }
}

const CACHE_PREFIX = 'auronix.seller.cache.v2:';

export type CachedResult<T> = {
  data: T;
  cached: boolean;
  syncedAt: number;
};

function friendlyMessage(status: number, body: any) {
  const server = typeof body?.error === 'string' ? body.error : '';
  if (server) return server;
  if (status === 401 || status === 403) return 'Seller access could not be verified. Sign in again or contact Auronix Support.';
  if (status === 409) return 'This information changed on another device. Refresh before saving.';
  if (status >= 500) return 'Auronix services are temporarily unavailable. Please try again.';
  return 'Auronix could not complete this request.';
}

async function token() {
  const user = auth.currentUser;
  if (!user) throw new SellerApiError('Your seller session has expired. Please sign in again.', { status: 401 });
  return user.getIdToken();
}

export async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const idToken = authenticated ? await token() : undefined;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        ...(init.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new SellerApiError('You appear to be offline. Showing saved seller data where available.', { offline: true });
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SellerApiError(friendlyMessage(response.status, body), {
      status: response.status,
      code: body?.code,
      conflict: response.status === 409,
    });
  }
  return body as T;
}

export async function cachedGet<T>(cacheKey: string, path: string, options: { maxAgeMs?: number; force?: boolean } = {}): Promise<CachedResult<T>> {
  const key = `${CACHE_PREFIX}${auth.currentUser?.uid || 'anonymous'}:${cacheKey}`;
  const maxAgeMs = options.maxAgeMs ?? 2 * 60_000;
  const stored = await AsyncStorage.getItem(key).catch(() => null);
  let cached: { data: T; syncedAt: number } | null = null;
  if (stored) {
    try { cached = JSON.parse(stored); } catch { cached = null; }
  }

  if (!options.force && cached && Date.now() - cached.syncedAt < maxAgeMs) {
    return { ...cached, cached: true };
  }

  try {
    const data = await request<T>(path);
    const syncedAt = Date.now();
    await AsyncStorage.setItem(key, JSON.stringify({ data, syncedAt })).catch(() => undefined);
    return { data, cached: false, syncedAt };
  } catch (error) {
    if (cached && error instanceof SellerApiError && error.offline) return { ...cached, cached: true };
    throw error;
  }
}

export async function invalidateCache(prefix = '') {
  const uid = auth.currentUser?.uid || 'anonymous';
  const keys = await AsyncStorage.getAllKeys().catch(() => []);
  const matches = keys.filter(key => key.startsWith(`${CACHE_PREFIX}${uid}:${prefix}`));
  if (matches.length) await AsyncStorage.multiRemove(matches).catch(() => undefined);
}
