import { cachedGet } from '@/src/services/http';
import type { SellerOverview } from '@/src/types';

export const sellerService = {
  overview: (force = false) => cachedGet<SellerOverview>('overview', '/api/seller/overview', { force, maxAgeMs: 60_000 }),
};
