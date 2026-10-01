import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { discardOperation, flushSyncQueue, getSyncQueue } from '@/src/services/offline-sync';
import type { AppColors } from '@/src/theme';
import type { OfflineOperation } from '@/src/types';

export default function SyncQueue() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<OfflineOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setItems(await getSyncQueue());
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function sync() {
    setSyncing(true); setMessage('');
    try {
      const result = await flushSyncQueue();
      setMessage(result.conflicts ? `${result.synced} synced · ${result.conflicts} conflict${result.conflicts === 1 ? '' : 's'} need review.` : `${result.synced} queued change${result.synced === 1 ? '' : 's'} synced.`);
      await load();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Sync could not complete.'); }
    finally { setSyncing(false); }
  }

  function discard(item: OfflineOperation) {
    Alert.alert('Discard queued change?', 'This local deferred write will be removed and will not be sent to Auronix.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => void (async () => { await discardOperation(item.id); await load(); })() }]);
  }

  return <Screen><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>OFFLINE RECOVERY</Text><Text style={styles.title}>Sync Queue</Text></View>{items.length ? <StatusPill value={`${items.length} queued`} /> : null}</View>
    {loading ? <View style={styles.loader}><IOSSpinner /></View> : <ScrollView contentContainerStyle={styles.content}>
      <GlassCard style={styles.notice}><Ionicons name="cloud-offline-outline" size={21} color={colors.accent} /><Text style={styles.noticeText}>Safe offline product writes are queued locally and retried when Auronix Seller returns to the foreground. Version conflicts stop instead of overwriting newer server data.</Text></GlassCard>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {items.length ? <><PrimaryButton loading={syncing} onPress={() => void sync()}>Retry Sync Now</PrimaryButton><Text style={ui.sectionTitle}>Pending changes</Text>{items.map(item => <GlassCard key={item.id} style={styles.item}><View style={[styles.icon, item.status === 'conflict' && { backgroundColor: colors.warningSoft }, item.status === 'failed' && { backgroundColor: colors.dangerSoft }]}><Ionicons name={item.status === 'conflict' ? 'git-compare-outline' : item.status === 'failed' ? 'alert-circle-outline' : 'cloud-upload-outline'} size={20} color={item.status === 'conflict' ? colors.warning : item.status === 'failed' ? colors.danger : colors.accent} /></View><View style={{ flex: 1 }}><View style={styles.top}><Text style={styles.itemTitle}>{item.action} {item.entity}</Text><StatusPill value={item.status} /></View><Text style={styles.meta}>Queued {new Date(item.createdAt).toLocaleString()} · attempts {item.retryCount}</Text>{item.lastError ? <Text style={styles.itemError}>{item.lastError}</Text> : null}</View><Pressable onPress={() => discard(item)} hitSlop={8}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable></GlassCard>)}</> : <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="checkmark-circle" size={35} color={colors.success} /></View><Text style={styles.emptyTitle}>Everything is synced</Text><Text style={styles.emptyBody}>There are no deferred seller changes waiting on this device.</Text></View>}
    </ScrollView>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }, back: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 2 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 18, paddingBottom: 45, gap: 12 }, notice: { padding: 15, flexDirection: 'row', gap: 10, alignItems: 'center' }, noticeText: { color: colors.muted, fontSize: 9, lineHeight: 14, flex: 1 }, message: { color: colors.muted, fontSize: 10, lineHeight: 15 }, item: { padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center' }, icon: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, top: { flexDirection: 'row', gap: 8, alignItems: 'center' }, itemTitle: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: '900', textTransform: 'capitalize' }, meta: { color: colors.muted, fontSize: 8, marginTop: 4 }, itemError: { color: colors.danger, fontSize: 8, lineHeight: 12, marginTop: 5 }, empty: { minHeight: 380, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 9 }, emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, emptyBody: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
}); }
