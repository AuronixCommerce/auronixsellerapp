import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, PrimaryButton, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';
import type { Product } from '@/src/types';

export type ProductFormValue = {
  name: string;
  brand: string;
  sku: string;
  upc: string;
  ean: string;
  asin: string;
  category: string;
  description: string;
  cost: string;
  sellingPrice: string;
  marketplaceFees: string;
  fulfillmentFees: string;
  inventoryQuantity: string;
  lowStockThreshold: string;
  supplier: string;
  marketplace: string;
  status: string;
  version?: number;
};

export function formFromProduct(product?: Partial<Product>): ProductFormValue {
  const text = (value: unknown) => value === null || value === undefined ? '' : String(value);
  return {
    name: text(product?.name), brand: text(product?.brand), sku: text(product?.sku), upc: text(product?.upc), ean: text(product?.ean), asin: text(product?.asin), category: text(product?.category), description: text(product?.description),
    cost: text(product?.cost), sellingPrice: text(product?.sellingPrice), marketplaceFees: text(product?.marketplaceFees), fulfillmentFees: text(product?.fulfillmentFees), inventoryQuantity: text(product?.inventoryQuantity), lowStockThreshold: text(product?.lowStockThreshold), supplier: text(product?.supplier), marketplace: text(product?.marketplace), status: text(product?.status || 'draft'), version: product?.version,
  };
}

function calculate(form: ProductFormValue) {
  const number = (value: string) => value.trim() === '' ? null : Number(value);
  const price = number(form.sellingPrice), cost = number(form.cost), market = number(form.marketplaceFees) || 0, fulfillment = number(form.fulfillmentFees) || 0;
  if (price === null || cost === null || !Number.isFinite(price) || !Number.isFinite(cost)) return { profit: null, margin: null, roi: null };
  const profit = price - cost - market - fulfillment;
  return { profit, margin: price ? profit / price * 100 : null, roi: cost ? profit / cost * 100 : null };
}

export function ProductForm({ initial, submitLabel = 'Save Product', busy, error, onSubmit }: { initial?: Partial<Product>; submitLabel?: string; busy?: boolean; error?: string; onSubmit: (value: ProductFormValue) => Promise<void> | void }) {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState<ProductFormValue>(() => formFromProduct(initial));
  const financial = calculate(form);
  const set = (key: keyof ProductFormValue, value: string) => setForm(current => ({ ...current, [key]: value }));
  const numeric: (keyof ProductFormValue)[] = ['cost', 'sellingPrice', 'marketplaceFees', 'fulfillmentFees', 'inventoryQuantity', 'lowStockThreshold'];

  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <GlassCard style={styles.section}><Text style={styles.sectionTitle}>Product identity</Text>{[
      ['name','Product name'],['brand','Brand'],['sku','SKU'],['upc','UPC'],['ean','EAN'],['asin','ASIN'],['category','Category']
    ].map(([key,label]) => <View key={key}><Text style={ui.label}>{label}</Text><TextInput value={String(form[key as keyof ProductFormValue] || '')} onChangeText={value => set(key as keyof ProductFormValue, value)} placeholder={label} placeholderTextColor={colors.muted} style={ui.input} autoCapitalize={['sku','upc','ean','asin'].includes(key) ? 'characters' : 'sentences'} /></View>)}<Text style={ui.label}>Description</Text><TextInput multiline value={form.description} onChangeText={value => set('description', value)} placeholder="Product details" placeholderTextColor={colors.muted} style={[ui.input, ui.textarea]} /></GlassCard>

    <GlassCard style={styles.section}><Text style={styles.sectionTitle}>Pricing & inventory</Text>{[
      ['cost','Product cost'],['sellingPrice','Selling price'],['marketplaceFees','Marketplace fees'],['fulfillmentFees','Shipping / FBA fees'],['inventoryQuantity','Inventory quantity'],['lowStockThreshold','Low stock threshold']
    ].map(([key,label]) => <View key={key}><Text style={ui.label}>{label}</Text><TextInput value={String(form[key as keyof ProductFormValue] || '')} onChangeText={value => set(key as keyof ProductFormValue, value)} placeholder="0" placeholderTextColor={colors.muted} style={ui.input} keyboardType={numeric.includes(key as keyof ProductFormValue) ? 'decimal-pad' : 'default'} /></View>)}
      <View style={styles.financialRow}><View><Text style={styles.financialLabel}>PROFIT</Text><Text style={styles.financialValue}>{financial.profit === null ? '—' : `$${financial.profit.toFixed(2)}`}</Text></View><View><Text style={styles.financialLabel}>MARGIN</Text><Text style={styles.financialValue}>{financial.margin === null ? '—' : `${financial.margin.toFixed(1)}%`}</Text></View><View><Text style={styles.financialLabel}>ROI</Text><Text style={styles.financialValue}>{financial.roi === null ? '—' : `${financial.roi.toFixed(1)}%`}</Text></View></View>
    </GlassCard>

    <GlassCard style={styles.section}><Text style={styles.sectionTitle}>Operations</Text>{[['supplier','Supplier'],['marketplace','Marketplace']].map(([key,label]) => <View key={key}><Text style={ui.label}>{label}</Text><TextInput value={String(form[key as keyof ProductFormValue] || '')} onChangeText={value => set(key as keyof ProductFormValue, value)} placeholder={label} placeholderTextColor={colors.muted} style={ui.input} /></View>)}<Text style={styles.helper}>Images, barcode scanning and marketplace adapters use the same product record and can be attached without creating a second product system.</Text></GlassCard>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <PrimaryButton loading={busy} onPress={() => onSubmit(form)}>{submitLabel}</PrimaryButton>
  </ScrollView>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 48, gap: 14 }, section: { padding: 17, gap: 10 }, sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 3 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 14, marginTop: 4 }, financialLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, financialValue: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 3 },
  helper: { color: colors.muted, fontSize: 10, lineHeight: 15 }, error: { color: colors.danger, fontSize: 11, lineHeight: 17 },
}); }
