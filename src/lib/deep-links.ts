import type { Href } from 'expo-router';
import type { SellerNotification } from '@/src/types';

export function notificationHref(item: Pick<SellerNotification, 'href' | 'productId' | 'catalogId' | 'ticketId' | 'documentId'>): Href {
  if (item.productId) return { pathname: '/products/[id]', params: { id: item.productId } } as Href;
  if (item.ticketId) return { pathname: '/support/[id]', params: { id: item.ticketId } } as Href;
  if (item.documentId) return '/documents' as Href;
  if (item.catalogId) return '/(tabs)/catalogs' as Href;

  const href = String(item.href || '').trim();
  if (/^\/support\/[A-Za-z0-9_-]+$/.test(href)) return href as Href;
  if (href.includes('/catalog')) return '/(tabs)/catalogs' as Href;
  if (href.includes('/support')) return '/(tabs)/support' as Href;
  if (href.includes('/product')) return '/(tabs)/products' as Href;
  if (href.includes('/application')) return '/application' as Href;
  if (href.includes('/document')) return '/documents' as Href;
  if (href.includes('/marketplace')) return '/marketplaces' as Href;
  return '/(tabs)/notifications' as Href;
}

export function rawPushHref(value: unknown): Href {
  const href = typeof value === 'string' ? value.trim() : '';
  if (/^\/support\/[A-Za-z0-9_-]+$/.test(href)) return href as Href;
  if (href === '/(tabs)/products' || href === '/(tabs)/catalogs' || href === '/(tabs)/support' || href === '/(tabs)/notifications' || href === '/(tabs)/ai' || href === '/(tabs)/more') return href as Href;
  if (href.includes('/catalog')) return '/(tabs)/catalogs' as Href;
  if (href.includes('/support')) return '/(tabs)/support' as Href;
  if (href.includes('/product')) return '/(tabs)/products' as Href;
  return '/(tabs)/notifications' as Href;
}
