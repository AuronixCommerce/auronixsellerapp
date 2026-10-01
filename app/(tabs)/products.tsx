import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, Header, PrimaryButton, Screen, StatusPill } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { productService } from '@/src/services/product-service';
import type { AppColors } from '@/src/theme';
import type { Product } from '@/src/types';

const statuses = ['all', 'draft', 'review', 'active', 'rejected', 'paused', 'archived'];
const sorts = [
  ['newest', 'Newest'], ['oldest', 'Oldest'], ['profit', 'Highest profit'], ['low-stock', 'Lowest stock'], ['high-stock', 'Highest stock'], ['price', 'Price'], ['alpha', 'A–Z'],
] as const;

function money(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `$${value.toFixed(2)}`;
}

export default function Products() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const result = await productService.list({ q, status, sort }, force);
      setProducts(result.data.products || []);
      setCached(result.cached);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, sort, status]);

  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  return (
    <Screen>
      <Header
        eyebrow="PRODUCT CENTER"
        title="Products"
        action={<PrimaryButton style={styles.add} onPress={() => router.push('/products/new')}><Ionicons name="add" size={23} color={colors.inverse} /></PrimaryButton>}
      />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => void load(true)} placeholder="Search name, SKU, UPC, ASIN…" placeholderTextColor={colors.muted} style={styles.search} returnKeyType="search" />
        {q ? <Pressable onPress={() => { setQ(''); setTimeout(() => void load(true), 0); }}><Ionicons name="close-circle" size={19} color={colors.muted} /></Pressable> : null}
      </View>
      <View style={styles.filterLine}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {statuses.map(item => <Pressable key={item} onPress={() => setStatus(item)} style={[styles.filter, status === item && styles.filterActive]}><Text style={[styles.filterText, status === item && styles.filterTextActive]}>{item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}
        </ScrollView>
        <Pressable onPress={() => setShowSort(value => !value)} style={styles.sortButton}><Ionicons name="swap-vertical" size={17} color={colors.ink} /></Pressable>
      </View>
      {showSort ? <GlassCard style={styles.sortMenu}>{sorts.map(([key, label]) => <Pressable key={key} onPress={() => { setSort(key); setShowSort(false); }} style={styles.sortRow}><Text style={[styles.sortText, sort === key && { color: colors.accent }]}>{label}</Text>{sort === key ? <Ionicons name="checkmark" color={colors.accent} size={18} /> : null}</Pressable>)}</GlassCard> : null}
      {cached ? <View style={styles.cached}><Ionicons name="cloud-offline-outline" size={13} color={colors.warning} /><Text style={styles.cachedText}>Showing saved products</Text></View> : null}
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load(true)}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />}
        contentContainerStyle={[styles.list, products.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={!loading ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="cube-outline" size={29} color={colors.accent} /></View><Text style={styles.emptyTitle}>No products found</Text><Text style={styles.emptyBody}>{q || status !== 'all' ? 'Change your search or filters.' : 'Create your first product or import products from a supplier catalog.'}</Text><PrimaryButton onPress={() => router.push('/products/new')}>Add Product</PrimaryButton></View> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })}>
            <GlassCard style={styles.card}>
              <View style={styles.imagePlaceholder}>{item.imageUrls?.length ? <Ionicons name="image" size={22} color={colors.accent} /> : <Ionicons name="cube-outline" size={22} color={colors.muted} />}</View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}><Text numberOfLines={1} style={styles.title}>{item.name}</Text><StatusPill value={item.status || 'Draft'} /></View>
                <Text numberOfLines={1} style={styles.meta}>{[item.sku && `SKU ${item.sku}`, item.upc && `UPC ${item.upc}`, item.asin && `ASIN ${item.asin}`].filter(Boolean).join(' · ') || 'Identifiers incomplete'}</Text>
                <View style={styles.numbers}><View><Text style={styles.numberLabel}>Inventory</Text><Text style={styles.numberValue}>{item.inventoryQuantity ?? 0}</Text></View><View><Text style={styles.numberLabel}>Price</Text><Text style={styles.numberValue}>{money(item.sellingPrice)}</Text></View><View><Text style={styles.numberLabel}>Profit</Text><Text style={[styles.numberValue, item.estimatedProfit !== null && item.estimatedProfit !== undefined && item.estimatedProfit < 0 && { color: colors.danger }]}>{money(item.estimatedProfit)}</Text></View></View>
                {item.attention?.length ? <View style={styles.warning}><Ionicons name="alert-circle-outline" size={13} color={colors.warning} /><Text numberOfLines={1} style={styles.warningText}>{item.attention.join(' · ')}</Text></View> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </GlassCard>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    add: { width: 44, minHeight: 44, paddingHorizontal: 0 },
    searchWrap: { marginHorizontal: 18, minHeight: 49, borderRadius: 17, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 },
    search: { flex: 1, color: colors.ink, fontSize: 14 },
    filterLine: { flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 12, marginTop: 10, gap: 8 }, filters: { gap: 7, paddingRight: 3 },
    filter: { paddingHorizontal: 12, minHeight: 35, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent }, filterText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, filterTextActive: { color: colors.accent },
    sortButton: { width: 37, height: 37, borderRadius: 13, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    sortMenu: { position: 'absolute', zIndex: 20, top: 164, right: 15, width: 190, padding: 7 }, sortRow: { minHeight: 42, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sortText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    cached: { marginHorizontal: 18, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }, cachedText: { color: colors.warning, fontSize: 9, fontWeight: '700' },
    error: { marginHorizontal: 18, marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: colors.dangerSoft, flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, errorText: { flex: 1, color: colors.danger, fontSize: 10 }, retry: { color: colors.accent, fontSize: 10, fontWeight: '900' },
    list: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130, gap: 10 },
    card: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, imagePlaceholder: { width: 55, height: 55, borderRadius: 17, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: colors.ink, fontSize: 15, fontWeight: '900', flex: 1 }, meta: { color: colors.muted, fontSize: 9, marginTop: 5 },
    numbers: { flexDirection: 'row', gap: 18, marginTop: 11 }, numberLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' }, numberValue: { color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: 2 },
    warning: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, warningText: { color: colors.warning, fontSize: 9, flex: 1, fontWeight: '700' },
    empty: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }, emptyIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' }, emptyBody: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 5 },
  });
}
