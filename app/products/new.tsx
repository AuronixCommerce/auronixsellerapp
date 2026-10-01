import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductForm, type ProductFormValue } from '@/components/product-form';
import { Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { productService } from '@/src/services/product-service';
import type { AppColors } from '@/src/theme';

export default function NewProduct() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(form: ProductFormValue) {
    if (!form.name.trim()) return setError('Product name is required.');
    setBusy(true); setError('');
    try {
      const result = await productService.create({ ...form, status: 'draft' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.replace({ pathname: '/products/[id]', params: { id: result.product.id, queued: result.queued ? '1' : '0' } });
    } catch (caught) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      setError(caught instanceof Error ? caught.message : 'Unable to create this product.');
    } finally { setBusy(false); }
  }

  return <Screen><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>PRODUCT CENTER</Text><Text style={styles.title}>New product</Text></View></View><ProductForm busy={busy} error={error} submitLabel="Create Product" onSubmit={save} /></Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 15 }, back: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border }, kicker: { color: colors.accent, fontSize: 9, letterSpacing: 1.5, fontWeight: '900' }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7, marginTop: 2 } }); }
