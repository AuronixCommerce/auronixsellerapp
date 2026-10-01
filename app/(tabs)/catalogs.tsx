import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { catalogService, type CatalogUploadAsset } from '@/src/services/catalog-service';
import type { AppColors } from '@/src/theme';
import type { Catalog } from '@/src/types';

function bytes(value?: number) {
  if (!value) return '—';
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function canAnalyze(item: Catalog) {
  return item.originalName?.toLowerCase().endsWith('.csv') || item.contentType?.includes('csv');
}

export default function Catalogs() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [asset, setAsset] = useState<CatalogUploadAsset | null>(null);
  const [supplier, setSupplier] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState('');

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const result = await catalogService.list(force);
      setCatalogs(result.data.catalogs || []);
      setCached(result.cached);
      setError('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load catalogs.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    setAsset({ uri: file.uri, name: file.name, mimeType: file.mimeType, size: file.size });
    setName(file.name.replace(/\.[^.]+$/, ''));
  }

  async function upload() {
    if (!asset) return setError('Choose a catalog file first.');
    setUploading(true); setProgress(0); setError('');
    try {
      await catalogService.upload(asset, { name: name.trim() || asset.name, supplier: supplier.trim(), description: description.trim() }, setProgress);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setShowUpload(false); setAsset(null); setName(''); setSupplier(''); setDescription(''); setProgress(0);
      await load(true);
    } catch (caught) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      setError(caught instanceof Error ? caught.message : 'Unable to upload catalog.');
    } finally { setUploading(false); }
  }

  async function analyze(item: Catalog) {
    setAnalyzing(item.id);
    setError('');
    try {
      await catalogService.analyze(item.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await load(true);
      router.push({ pathname: '/catalog-opportunities', params: { catalogId: item.id } });
    } catch (caught) {
      await load(true).catch(() => undefined);
      setError(caught instanceof Error ? caught.message : 'Unable to analyze this catalog.');
    } finally { setAnalyzing(''); }
  }

  function confirmDelete(item: Catalog) {
    Alert.alert('Delete catalog?', `${item.name} and its private uploaded file will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(item.id) },
    ]);
  }
  async function remove(id: string) {
    try { await catalogService.remove(id); await load(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to delete catalog.'); }
  }

  return <Screen>
    <Header eyebrow="SUPPLIER & CATALOG CENTER" title="Catalogs" action={<PrimaryButton style={styles.add} onPress={() => { setError(''); setShowUpload(true); }}><Ionicons name="cloud-upload-outline" size={21} color={colors.inverse} /></PrimaryButton>} />
    {cached ? <View style={styles.cached}><Ionicons name="cloud-offline-outline" size={13} color={colors.warning} /><Text style={styles.cachedText}>Showing saved catalog metadata</Text></View> : null}
    {error && !showUpload ? <View style={styles.errorRow}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load(true)}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}
    {loading && !catalogs.length ? <View style={styles.loader}><IOSSpinner /></View> : <FlatList
      data={catalogs}
      keyExtractor={item => item.id}
      contentContainerStyle={[styles.list, !catalogs.length && { flexGrow: 1 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />}
      ListHeaderComponent={<View style={{ gap: 10 }}><GlassCard style={styles.info}><View style={styles.infoIcon}><Ionicons name="lock-closed-outline" size={20} color={colors.success} /></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>Private supplier uploads</Text><Text style={styles.infoBody}>PDF, CSV, XLSX and XLS files upload through the authenticated Auronix backend to private R2 storage. Storage credentials never enter the app.</Text></View></GlassCard><Pressable onPress={() => router.push('/catalog-opportunities')}><GlassCard style={styles.opportunityBanner}><View style={styles.opportunityIcon}><Ionicons name="sparkles-outline" size={20} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>Opportunity review</Text><Text style={styles.infoBody}>Review all analyzed catalog rows and convert selected items into draft products.</Text></View><Ionicons name="chevron-forward" size={17} color={colors.muted} /></GlassCard></Pressable></View>}
      ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="documents-outline" size={31} color={colors.accent} /></View><Text style={styles.emptyTitle}>Upload your first supplier catalog</Text><Text style={styles.emptyBody}>CSV catalogs can be analyzed into review opportunities. Other file types remain securely stored until a compatible parser is connected.</Text><PrimaryButton onPress={() => setShowUpload(true)}>Upload Catalog</PrimaryButton></View>}
      renderItem={({ item }) => <GlassCard style={styles.card}><View style={styles.fileIcon}><Ionicons name={item.contentType?.includes('pdf') ? 'document-text-outline' : 'grid-outline'} size={22} color={colors.accent} /></View><View style={{ flex: 1 }}><View style={styles.cardTop}><Text numberOfLines={1} style={styles.title}>{item.name}</Text><StatusPill value={item.status || 'Uploaded'} /></View><Text style={styles.meta}>{[item.supplier, bytes(item.size), item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''].filter(Boolean).join(' · ')}</Text><Text style={[styles.aiState, item.aiStatus === 'analyzed' && { color: colors.success }]}>{item.aiStatus === 'not-analyzed' ? 'Ready for analysis' : item.aiStatus === 'needs-csv' ? 'CSV export required for automated analysis' : `AI: ${item.aiStatus || 'not analyzed'}`}</Text><View style={styles.cardActions}>{item.aiStatus === 'analyzed' ? <PrimaryButton tone="quiet" style={styles.smallButton} onPress={() => router.push({ pathname: '/catalog-opportunities', params: { catalogId: item.id } })}>View Opportunities</PrimaryButton> : <PrimaryButton tone="quiet" style={styles.smallButton} disabled={!canAnalyze(item)} loading={analyzing === item.id} onPress={() => void analyze(item)}>{canAnalyze(item) ? 'Analyze CSV' : 'CSV required'}</PrimaryButton>}<Pressable hitSlop={10} onPress={() => confirmDelete(item)} style={styles.deleteButton}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable></View></View></GlassCard>}
    />}

    <Modal visible={showUpload} transparent animationType="slide" onRequestClose={() => !uploading && setShowUpload(false)}>
      <View style={styles.overlay}><GlassCard style={styles.sheet}><View style={styles.sheetHead}><View><Text style={ui.label}>SECURE UPLOAD</Text><Text style={ui.sectionTitle}>Supplier catalog</Text></View><Pressable disabled={uploading} onPress={() => setShowUpload(false)}><Ionicons name="close-circle" size={30} color={colors.muted} /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 11 }}>
        <Pressable disabled={uploading} onPress={pick} style={styles.picker}>{asset ? <><Ionicons name="document-attach-outline" size={25} color={colors.accent} /><Text numberOfLines={1} style={styles.pickerTitle}>{asset.name}</Text><Text style={styles.pickerMeta}>{bytes(asset.size || undefined)}</Text></> : <><Ionicons name="cloud-upload-outline" size={28} color={colors.accent} /><Text style={styles.pickerTitle}>Choose PDF, CSV, XLSX or XLS</Text><Text style={styles.pickerMeta}>Maximum file size: 25 MB</Text></>}</Pressable>
        <Text style={ui.label}>Catalog name</Text><TextInput value={name} onChangeText={setName} style={ui.input} placeholder="Catalog name" placeholderTextColor={colors.muted} />
        <Text style={ui.label}>Supplier</Text><TextInput value={supplier} onChangeText={setSupplier} style={ui.input} placeholder="Supplier name" placeholderTextColor={colors.muted} />
        <Text style={ui.label}>Notes</Text><TextInput value={description} onChangeText={setDescription} multiline style={[ui.input, ui.textarea]} placeholder="Optional notes" placeholderTextColor={colors.muted} />
        {uploading ? <View style={styles.progressWrap}><View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${progress}%` }]} /></View><Text style={styles.progressText}>{progress < 100 ? `Uploading ${progress}%` : 'Finishing secure upload…'}</Text></View> : null}
        {error ? <Text style={styles.modalError}>{error}</Text> : null}
        <PrimaryButton loading={uploading} disabled={!asset} onPress={upload}>Upload Securely</PrimaryButton>
      </ScrollView></GlassCard></View>
    </Modal>
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  add: { width: 46, minHeight: 46, paddingHorizontal: 0 }, cached: { marginHorizontal: 18, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }, cachedText: { color: colors.warning, fontSize: 9, fontWeight: '700' },
  errorRow: { marginHorizontal: 18, marginBottom: 8, padding: 12, backgroundColor: colors.dangerSoft, borderRadius: 14, flexDirection: 'row', gap: 10, justifyContent: 'space-between' }, errorText: { color: colors.danger, fontSize: 10, flex: 1 }, retry: { color: colors.accent, fontSize: 10, fontWeight: '900' }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 18, paddingBottom: 130, gap: 10 }, info: { padding: 15, flexDirection: 'row', gap: 11, alignItems: 'center', marginBottom: 4 }, infoIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }, infoTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, infoBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, opportunityBanner: { padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center' }, opportunityIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }, fileIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, cardTop: { flexDirection: 'row', gap: 8, alignItems: 'center' }, title: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 9, marginTop: 5 }, aiState: { color: colors.warning, fontSize: 9, fontWeight: '700', marginTop: 6 }, cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 }, smallButton: { minHeight: 37, paddingHorizontal: 12 }, deleteButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 }, emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' }, emptyBody: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginBottom: 5 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }, sheet: { maxHeight: '91%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 18, paddingBottom: 34 }, sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  picker: { minHeight: 128, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 6 }, pickerTitle: { color: colors.ink, fontSize: 12, fontWeight: '800', maxWidth: '90%' }, pickerMeta: { color: colors.muted, fontSize: 9 },
  progressWrap: { gap: 7 }, progressTrack: { height: 6, borderRadius: 99, backgroundColor: colors.surfaceSoft, overflow: 'hidden' }, progressBar: { height: 6, borderRadius: 99, backgroundColor: colors.accent }, progressText: { color: colors.muted, fontSize: 9, textAlign: 'right', fontWeight: '700' }, modalError: { color: colors.danger, fontSize: 10, lineHeight: 16 },
}); }
