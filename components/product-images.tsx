import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { productImageService, type ProductImage } from '@/src/services/product-image-service';
import type { AppColors } from '@/src/theme';

export function ProductImages({ productId }: { productId: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sources, setSources] = useState<Record<string, { uri: string; headers: { Authorization: string } }>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await productImageService.list(productId);
      setImages(result.images || []);
      const pairs = await Promise.all((result.images || []).map(async image => [image.id, await productImageService.source(productId, image.id)] as const));
      setSources(Object.fromEntries(pairs.filter((pair): pair is readonly [string, { uri: string; headers: { Authorization: string } }] => Boolean(pair[1]))));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load product images.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    try {
      const asset = await productImageService.pick();
      if (!asset) return;
      setUploading(true);
      setProgress(0);
      setError('');
      await productImageService.upload(productId, asset, setProgress);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await load();
    } catch (caught) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      setError(caught instanceof Error ? caught.message : 'Unable to add product image.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function confirmRemove(image: ProductImage) {
    Alert.alert('Remove product photo?', 'The private product image will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(image) },
    ]);
  }

  async function remove(image: ProductImage) {
    try {
      await productImageService.remove(productId, image.id);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete product image.');
    }
  }

  return <View style={styles.wrap}>
    <View style={styles.head}><View><Text style={styles.title}>Product photos</Text><Text style={styles.meta}>{images.length}/8 private images</Text></View><PrimaryButton tone="quiet" style={styles.add} loading={uploading} disabled={images.length >= 8} onPress={() => void add()}><Ionicons name="add" size={19} color={colors.ink} />Add Photo</PrimaryButton></View>
    {uploading ? <View style={styles.progressWrap}><View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${Math.max(4, progress)}%` }]} /></View><Text style={styles.progressText}>{progress < 100 ? `Uploading ${progress}%` : 'Securing image…'}</Text></View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {loading ? <GlassCard style={styles.loader}><IOSSpinner /></GlassCard> : images.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>{images.map(image => <View key={image.id} style={styles.imageWrap}>{sources[image.id] ? <Image source={sources[image.id]} resizeMode="cover" style={styles.image} /> : <View style={[styles.image, styles.placeholder]}><IOSSpinner size={18} /></View>}<Pressable hitSlop={8} onPress={() => confirmRemove(image)} style={styles.remove}><Ionicons name="close" size={14} color="#fff" /></Pressable></View>)}</ScrollView> : <GlassCard style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="images-outline" size={24} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={styles.emptyTitle}>No product photos</Text><Text style={styles.emptyBody}>Add up to eight JPG, PNG, or WebP images. Files stay private behind your seller session.</Text></View></GlassCard>}
  </View>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  wrap: { gap: 9 }, head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, title: { color: colors.ink, fontSize: 18, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 9, marginTop: 2 }, add: { minHeight: 39, paddingHorizontal: 12, flexDirection: 'row', gap: 6 }, progressWrap: { gap: 6 }, progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden', backgroundColor: colors.surfaceSoft }, progressBar: { height: 6, borderRadius: 99, backgroundColor: colors.accent }, progressText: { color: colors.muted, fontSize: 9, textAlign: 'right' }, error: { color: colors.danger, fontSize: 10, lineHeight: 15 }, loader: { height: 120, alignItems: 'center', justifyContent: 'center' }, gallery: { gap: 10, paddingRight: 18 }, imageWrap: { width: 150, height: 150, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surfaceSoft }, image: { width: '100%', height: '100%' }, placeholder: { alignItems: 'center', justifyContent: 'center' }, remove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.62)', alignItems: 'center', justifyContent: 'center' }, empty: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11 }, emptyIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, emptyBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
}); }
