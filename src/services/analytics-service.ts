import { cachedGet } from '@/src/services/http';
import type { AnalyticsPoint, Product } from '@/src/types';

export type SellerAnalyticsResponse = {
  available: boolean;
  metrics: {
    revenue: number | null;
    profit: number | null;
    orders: number | null;
    sales: number | null;
    inventoryValue: number | null;
    averageMargin: number | null;
    sellThrough: number | null;
  };
  series: AnalyticsPoint[];
  productPerformance: { mostProfitable: Product[]; lowestStock: Product[]; needsAttention: Product[] };
  source: string;
  serverTime: number;
};

export const analyticsService = {
  get: (force = false) => cachedGet<SellerAnalyticsResponse>('analytics', '/api/seller/analytics', { force, maxAgeMs: 2 * 60_000 }),
};
