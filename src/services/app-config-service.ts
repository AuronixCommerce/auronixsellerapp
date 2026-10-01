import { request } from '@/src/services/http';

export type SellerMobileConfig = {
  configured: boolean;
  latestVersion?: string;
  minimumVersion?: string;
  forceUpdate?: boolean;
  message?: string;
  androidStoreUrl?: string;
  iosStoreUrl?: string;
};

function parts(version?: string) {
  return String(version || '0').split('.').map(value => Number.parseInt(value.replace(/\D.*$/, ''), 10) || 0).slice(0, 4);
}

export function compareVersions(left?: string, right?: string) {
  const a = parts(left);
  const b = parts(right);
  const length = Math.max(a.length, b.length, 3);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference) return difference > 0 ? 1 : -1;
  }
  return 0;
}

export const appConfigService = {
  load: () => request<SellerMobileConfig>('/api/mobile/seller-config', {}, false),
};
