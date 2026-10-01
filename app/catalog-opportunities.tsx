import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { catalogService } from '@/src/services/catalog-service';
import { productService } from '@/src/services/product-service';
import type { AppColors } from '@/src/theme';
import type { ProductOpportunity } from '@/src/types';

function money(value?: number | null) {
  return value === null || value === undefined || !Number.isFinite(value) ? '—' : `$${value.toFixed(2)}`;
}

export default function CatalogOpportunities() {
  const params = useLocalSearchParams<{ catalogId?: string }>();
  const catalogId = typeof params.catalogId === 'string' ? params.catalogId : undefined;
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ProductOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState('');

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const result = await catalogService.opportunities(catalogId, force);
      setItems(result.data.opportunities || []);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load catalog opportunities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [catalogId]);

  useMemo(() => { void load(false); return null; }, [load]);

  async function createDraft(item: ProductOpportunity) {
    setCreating(item.id);
    setError('');
    try {
      const result = await productService.create({
        name: item.productName,
        brand: item.brand,
        sku: item.sku,
        upc: item.upc,
        category: item.category,
        cost: item.supplierCost,
        sellingPrice: item.suggestedSellingPrice,
        marketplaceFees: item.estimatedFees,
        supplier: '',
        marketplace: item.marketplace,
        status: 'draft',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.push({ pathname: '/products/[id]', params: { id: result.product.id, queued: result.queued ? '1' : '0' } });
    } catch (caught) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      setError(caught instanceof Error ? caught.message : 'Unable to create a draft product.');
    } finally {
      setCreating('');
    }
  }

  return <Screen>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.kicker}>CATALOG INTELLIGENCE</Text><Text style={styles.title}>Opportunities</Text></View>
    </View>
    {loading && !items.length ? <View style={styles.loader}><IOSSpinner /></View> : <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />} contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.notice}><Ionicons name="information-circle-outline" size={21} color={colors.accent} /><View style={{ flex: 1 }}><Text style={styles.noticeTitle}>Review before listing</Text><Text style={styles.noticeBody}>Catalog-only opportunities contain supplier-file facts only. Marketplace demand, rank, buy box, fees and profitability stay unavailable unless real marketplace data exists.</Text></View></GlassCard>
      {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load(true)}>Retry</PrimaryButton></GlassCard> : null}
      {!items.length ? <GlassCard style={styles.empty}><Ionicons name="sparkles-outline" size={31} color={colors.muted} /><Text style={styles.emptyTitle}>No analyzed opportunities yet</Text><Text style={styles.emptyBody}>Run analysis from a CSV catalog to create reviewable product opportunities.</Text><PrimaryButton onPress={() => router.push('/(tabs)/catalogs')}>Open Catalogs</PrimaryButton></GlassCard> : items.map(item => <GlassCard key={item.id} style={styles.card}>
        <View style={styles.cardHead}><View style={{ flex: 1 }}><Text style={styles.name}>{item.productName}</Text><Text style={styles.meta}>{[item.brand, item.sku, item.upc].filter(Boolean).join(' · ') || 'No identifiers recorded'}</Text></View><StatusPill value={item.source === 'marketplace-data' ? 'Marketplace data' : 'Catalog only'} /></View>
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricLabel}>Supplier cost</Text><Text style={styles.metricValue}>{money(item.supplierCost)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Selling price</Text><Text style={styles.metricValue}>{money(item.suggestedSellingPrice)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Profit</Text><Text style={styles.metricValue}>{money(item.estimatedProfit)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>ROI</Text><Text style={styles.metricValue}>{item.roi === null || item.roi === undefined ? '—' : `${item.roi.toFixed(1)}%`}</Text></View>
        </View>
        {item.riskFlags?.length ? <View style={styles.risks}>{item.riskFlags.map(flag => <View key={flag} style={styles.risk}><Ionicons name="alert-circle-outline" size={13} color={colors.warning} /><Text style={styles.riskText}>{flag}</Text></View>)}</View> : null}
        <PrimaryButton loading={creating === item.id} onPress={() => void createDraft(item)}><Ionicons name="add-circle-outline" size={18} color={colors.inverse} />Create Draft Product</PrimaryButton>
      </GlassCard>)}
    </ScrollView>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }, back: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 2 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notice: { padding: 15, flexDirection: 'row', gap: 10 }, noticeTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, noticeBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, errorCard: { padding: 14, gap: 10 }, error: { color: colors.danger, fontSize: 10 },
  empty: { padding: 28, gap: 10, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' }, emptyBody: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  card: { padding: 16, gap: 13 }, cardHead: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, name: { color: colors.ink, fontSize: 16, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 9, marginTop: 4 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48%', borderRadius: 14, backgroundColor: colors.surfaceSoft, padding: 11 }, metricLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }, metricValue: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: 4 }, risks: { gap: 6 }, risk: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: colors.warningSoft, padding: 9, borderRadius: 12 }, riskText: { color: colors.warning, flex: 1, fontSize: 9, fontWeight: '700' },
}); }
