import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/src/lib/firebase';
import { invalidateCache, request, SellerApiError } from '@/src/services/http';
import type { OfflineOperation } from '@/src/types';

const QUEUE_KEY = 'auronix.seller.sync-queue.v1';

async function readQueue(): Promise<OfflineOperation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY).catch(() => null);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: OfflineOperation[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => undefined);
}

export async function getSyncQueue() {
  return readQueue();
}

export async function queueOperation(input: Omit<OfflineOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>) {
  const queue = await readQueue();
  const operation: OfflineOperation = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'queued',
  };
  queue.push(operation);
  await writeQueue(queue);
  return operation;
}

export async function discardOperation(id: string) {
  const queue = await readQueue();
  await writeQueue(queue.filter(item => item.id !== id));
}

export async function flushSyncQueue() {
  if (!auth.currentUser) return { synced: 0, remaining: 0, conflicts: 0 };
  const queue = await readQueue();
  if (!queue.length) return { synced: 0, remaining: 0, conflicts: 0 };

  const next: OfflineOperation[] = [];
  let synced = 0;
  let conflicts = 0;

  for (const item of queue) {
    if (item.status === 'conflict') {
      next.push(item);
      conflicts += 1;
      continue;
    }
    try {
      await request(item.path, {
        method: item.method,
        body: item.payload ? JSON.stringify(item.payload) : undefined,
      });
      synced += 1;
    } catch (error) {
      const apiError = error instanceof SellerApiError ? error : null;
      if (apiError?.conflict) {
        next.push({ ...item, status: 'conflict', retryCount: item.retryCount + 1, lastError: apiError.message });
        conflicts += 1;
        continue;
      }
      if (apiError?.offline) {
        next.push({ ...item, status: 'queued', lastError: apiError.message });
        break;
      }
      const retryCount = item.retryCount + 1;
      next.push({
        ...item,
        retryCount,
        status: retryCount >= 5 ? 'failed' : 'queued',
        lastError: error instanceof Error ? error.message : 'Sync failed.',
      });
    }
  }

  await writeQueue(next);
  if (synced) await invalidateCache();
  return { synced, remaining: next.length, conflicts };
}
