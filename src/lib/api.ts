import { push, ref, set } from 'firebase/database';
import { auth, database } from '@/src/lib/firebase';
import type { SellerNotification, Workspace } from '@/src/types';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://www.auronixcommerce.com').replace(/\/$/, '');

type ApiErrorBody = { error?: string; code?: string };

async function jsonRequest<T>(path: string, init?: RequestInit, authenticated = false): Promise<T> {
  const token = authenticated ? await auth.currentUser?.getIdToken() : undefined;
  if (authenticated && !token) throw new Error('Your seller session has expired. Please sign in again.');

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Unable to reach Auronix Commerce. Check your connection and try again.');
  }

  const data = await response.json().catch(() => ({} as ApiErrorBody)) as ApiErrorBody & T;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(data.error || 'Seller access could not be verified. Make sure this account is an approved Auronix seller.');
    }
    throw new Error(data.error || 'Auronix could not complete this request.');
  }

  return data as T;
}

export const sellerApi = {
  workspace: () => jsonRequest<Workspace>('/api/seller/workspace', undefined, true),
  create: (resource: 'product' | 'catalog' | 'ticket', values: Record<string, string>) =>
    jsonRequest<{ success: true; item: any }>('/api/seller/workspace', { method: 'POST', body: JSON.stringify({ resource, ...values }) }, true),
  updateProfile: (values: Record<string, string>) =>
    jsonRequest<{ success: true }>('/api/seller/workspace', { method: 'PATCH', body: JSON.stringify(values) }, true),
  remove: (resource: 'product' | 'catalog', id: string) =>
    jsonRequest<{ success: true }>(`/api/seller/workspace?resource=${resource}&id=${encodeURIComponent(id)}`, { method: 'DELETE' }, true),
  notifications: () => jsonRequest<{ notifications: SellerNotification[]; unread: number }>('/api/seller/notifications', undefined, true),
  markNotification: (id?: string) => jsonRequest<{ success: true }>('/api/seller/notifications', { method: 'PATCH', body: JSON.stringify(id ? { id } : { all: true }) }, true),
};

export async function askAuronix(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { signal?: AbortSignal },
) {
  return jsonRequest<{ success: boolean; response?: string; error?: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ pathname: '/seller/support', messages }),
    signal: options?.signal,
  });
}

export async function createPublicTicket(values: Record<string, string>) {
  const ticket = push(ref(database, 'tickets'));
  if (!ticket.key) throw new Error('Unable to create a ticket reference.');
  const now = Date.now();
  await set(ticket, { ...values, status: 'open', createdAt: now, updatedAt: now });
  return ticket.key;
}
