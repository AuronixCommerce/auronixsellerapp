import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProductForm, type ProductFormValue } from '@/components/product-form';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, StatusPill } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { productService } from '@/src/services/product-service';
import type { AppColors } from '@/src/theme';
import type { Product } from '@/src/types';

function money(value: number | null | undefined) { return value === null || value === undefined || !Number.isFinite(value) ? '—' : `$${value.toFixed(2)}`; }

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    if (!id || String(id).startsWith('offline-')) { setLoading(false); return; }
    try { const result = await productService.get(String(id), force); setProduct(result.data); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load product.'); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  async function save(form: ProductFormValue) {
    if (!product) return;
    setBusy(true); setError('');
    try {
      const result = await productService.update(product.id, { ...form, version: product.version });
      setProduct({ ...product, ...result.product });
      setEditing(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update product.'); }
    finally { setBusy(false); }
  }

  function confirmDelete() {
    if (!product) return;
    Alert.alert('Delete this product permanently?', `${product.name} will be removed from your seller workspace. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete permanently', style: 'destructive', onPress: () => void remove() },
    ]);
  }
  async function remove() {
    if (!product) return;
    setBusy(true);
    try { await productService.remove(product.id); await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); router.replace('/(tabs)/products'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to delete product.'); setBusy(false); }
  }

  async function duplicate() {
    if (!product) return;
    setBusy(true);
    try { const result = await productService.duplicate(product); router.push({ pathname: '/products/[id]', params: { id: result.product.id } }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to duplicate product.'); }
    finally { setBusy(false); }
  }

  async function archive() {
    if (!product) return;
    setBusy(true);
    try { const result = await productService.archive(product); setProduct(result.product); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to archive product.'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>PRODUCT CENTER</Text><Text numberOfLines={1} style={styles.headerTitle}>{product?.name || 'Product'}</Text></View>{product && !editing ? <Pressable onPress={() => setEditing(true)} style={styles.headerButton}><Ionicons name="create-outline" size={20} color={colors.ink} /></Pressable> : null}</View>
    {loading ? <View style={styles.loader}><IOSSpinner /></View> : error && !product ? <View style={styles.center}><Text style={styles.error}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load(true)}>Retry</PrimaryButton></View> : product ? editing ? <ProductForm key={product.version || 0} initial={product} busy={busy} error={error} submitLabel="Save Changes" onSubmit={save} /> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <GlassCard style={styles.hero}><View style={styles.heroTop}><View style={{ flex: 1 }}><Text style={styles.brand}>{product.brand || 'Unbranded'}</Text><Text style={styles.name}>{product.name}</Text></View><StatusPill value={product.status || 'Draft'} /></View><Text style={styles.identifiers}>{[product.sku && `SKU ${product.sku}`, product.upc && `UPC ${product.upc}`, product.ean && `EAN ${product.ean}`, product.asin && `ASIN ${product.asin}`].filter(Boolean).join(' · ') || 'No identifiers added yet'}</Text>{product.attention?.length ? <View style={styles.attention}><Ionicons name="alert-circle" size={16} color={colors.warning} /><Text style={styles.attentionText}>{product.attention.join(' · ')}</Text></View> : null}</GlassCard>
      <View style={styles.stats}><GlassCard style={styles.stat}><Text style={styles.statLabel}>PRICE</Text><Text style={styles.statValue}>{money(product.sellingPrice)}</Text></GlassCard><GlassCard style={styles.stat}><Text style={styles.statLabel}>PROFIT</Text><Text style={styles.statValue}>{money(product.estimatedProfit)}</Text></GlassCard><GlassCard style={styles.stat}><Text style={styles.statLabel}>ROI</Text><Text style={styles.statValue}>{product.roi === null || product.roi === undefined ? '—' : `${product.roi.toFixed(1)}%`}</Text></GlassCard></View>
      <Text style={styles.sectionTitle}>Inventory</Text><GlassCard style={styles.detail}><View style={styles.detailRow}><Text style={styles.detailLabel}>Available</Text><Text style={styles.detailValue}>{product.inventoryQuantity ?? 0}</Text></View><View style={styles.divider} /><View style={styles.detailRow}><Text style={styles.detailLabel}>Low-stock threshold</Text><Text style={styles.detailValue}>{product.lowStockThreshold ?? 0}</Text></View><View style={styles.divider} /><View style={styles.detailRow}><Text style={styles.detailLabel}>Inventory value</Text><Text style={styles.detailValue}>{product.cost === null || product.cost === undefined ? '—' : money(product.cost * (product.inventoryQuantity || 0))}</Text></View></GlassCard>
      <Text style={styles.sectionTitle}>Pricing</Text><GlassCard style={styles.detail}>{[['Cost', money(product.cost)],['Selling price',money(product.sellingPrice)],['Marketplace fees',money(product.marketplaceFees)],['Shipping / FBA fees',money(product.fulfillmentFees)],['Margin',product.margin === null || product.margin === undefined ? '—' : `${product.margin.toFixed(1)}%`]].map(([label,value], index) => <View key={label}><View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>{index < 4 ? <View style={styles.divider} /> : null}</View>)}</GlassCard>
      <Text style={styles.sectionTitle}>Operations</Text><GlassCard style={styles.detail}><View style={styles.detailRow}><Text style={styles.detailLabel}>Supplier</Text><Text style={styles.detailValue}>{product.supplier || 'Not set'}</Text></View><View style={styles.divider} /><View style={styles.detailRow}><Text style={styles.detailLabel}>Marketplace</Text><Text style={styles.detailValue}>{product.marketplace || 'Not connected'}</Text></View></GlassCard>
      <View style={styles.actions}><PrimaryButton tone="quiet" style={styles.action} loading={busy} onPress={duplicate}><Ionicons name="copy-outline" size={18} color={colors.ink} /><Text style={styles.actionText}>Duplicate</Text></PrimaryButton><PrimaryButton tone="quiet" style={styles.action} loading={busy} onPress={archive}><Ionicons name="archive-outline" size={18} color={colors.ink} /><Text style={styles.actionText}>Archive</Text></PrimaryButton></View>
      <PrimaryButton tone="danger" loading={busy} onPress={confirmDelete}>Delete Product</PrimaryButton>
    </ScrollView> : <View style={styles.center}><Text style={styles.error}>This offline draft will sync when your connection returns.</Text><PrimaryButton tone="quiet" onPress={() => router.back()}>Back</PrimaryButton></View>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 15 }, headerButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, headerTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', letterSpacing: -0.6, marginTop: 2 }, loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }, center: { flex: 1, justifyContent: 'center', padding: 28, gap: 14 }, content: { paddingHorizontal: 18, paddingBottom: 45, gap: 14 }, error: { color: colors.danger, fontSize: 11, lineHeight: 17 }, hero: { padding: 18 }, heroTop: { flexDirection: 'row', gap: 12 }, brand: { color: colors.accent, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }, name: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 5 }, identifiers: { color: colors.muted, fontSize: 9, marginTop: 12 }, attention: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 13, padding: 10, borderRadius: 13, backgroundColor: colors.warningSoft }, attentionText: { color: colors.warning, fontSize: 9, fontWeight: '700', flex: 1 }, stats: { flexDirection: 'row', gap: 9 }, stat: { flex: 1, padding: 13, minHeight: 82 }, statLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, statValue: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 7 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 2 }, detail: { paddingHorizontal: 16 }, detailRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }, detailLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' }, detailValue: { color: colors.ink, fontSize: 11, fontWeight: '800', textAlign: 'right', flexShrink: 1 }, divider: { height: 1, backgroundColor: colors.border }, actions: { flexDirection: 'row', gap: 9 }, action: { flex: 1, flexDirection: 'row', gap: 7 }, actionText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
}); }
