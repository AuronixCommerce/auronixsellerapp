import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, GlassCard, Header, IOSSpinner, PrimaryButton, Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { sellerApi } from '@/src/lib/api';
import { notificationHref } from '@/src/lib/deep-links';
import type { AppColors } from '@/src/theme';
import type { SellerNotification } from '@/src/types';

function sectionFor(createdAt?: number) {
  if (!createdAt) return 'Earlier';
  const age = Date.now() - createdAt;
  const today = new Date();
  const date = new Date(createdAt);
  if (today.toDateString() === date.toDateString()) return 'Today';
  if (age < 7 * 86400000) return 'This Week';
  return 'Earlier';
}

function iconFor(type?: string): keyof typeof Ionicons.glyphMap {
  const value = String(type || '').toLowerCase();
  if (value.includes('support')) return 'chatbubble-ellipses-outline';
  if (value.includes('catalog')) return 'documents-outline';
  if (value.includes('product')) return 'cube-outline';
  if (value.includes('document')) return 'folder-open-outline';
  if (value.includes('market')) return 'storefront-outline';
  if (value.includes('security')) return 'shield-checkmark-outline';
  return 'notifications-outline';
}

export default function Notifications() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const result = await sellerApi.notifications();
      setItems(result.notifications || []);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load updates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const shown = useMemo(() => filter === 'Unread' ? items.filter(item => !item.readAt) : items, [filter, items]);
  const unread = items.filter(item => !item.readAt).length;
  const groups = useMemo(() => ['Today', 'This Week', 'Earlier'].map(title => ({ title, items: shown.filter(item => sectionFor(item.createdAt) === title) })).filter(group => group.items.length), [shown]);

  async function mark(id?: string) {
    try {
      await sellerApi.markNotification(id);
      setItems(current => current.map(item => !id || item.id === id ? { ...item, readAt: Date.now() } : item));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update notifications.');
    }
  }

  async function open(item: SellerNotification) {
    if (!item.readAt) await mark(item.id);
    router.push(notificationHref(item));
  }

  return (
    <Screen>
      <Header eyebrow="SELLER UPDATES" title="Notifications" action={unread ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null} />
      <View style={styles.toolbar}>
        {(['All', 'Unread'] as const).map(value => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.active]}><Text style={[styles.filterText, filter === value && styles.activeText]}>{value}</Text></Pressable>)}
        <View style={{ flex: 1 }} />
        {unread ? <PrimaryButton tone="quiet" style={styles.mark} onPress={() => void mark()}>Mark all read</PrimaryButton> : null}
      </View>

      {loading ? <View style={styles.loader}><IOSSpinner /></View> : <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text></GlassCard> : null}
        {groups.length ? groups.map(group => <View key={group.title} style={styles.group}><Text style={styles.groupTitle}>{group.title}</Text>{group.items.map(item => <Pressable key={item.id} onPress={() => void open(item)}><GlassCard style={[styles.item, !item.readAt ? styles.unread : undefined]}><View style={styles.icon}><Ionicons name={iconFor(item.type)} size={21} color={colors.accent} /></View><View style={{ flex: 1 }}><View style={styles.meta}><Text style={styles.type}>{item.type || 'Account update'}</Text>{item.createdAt ? <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text> : null}</View><Text style={styles.title}>{item.title || 'Seller update'}</Text><Text style={styles.message}>{item.message}</Text></View>{!item.readAt ? <View style={styles.dot} /> : <Ionicons name="chevron-forward" size={16} color={colors.muted} />}</GlassCard></Pressable>)}</View>) : <EmptyState title="You’re all caught up" body={filter === 'Unread' ? 'There are no unread notifications.' : 'Product, catalog, support, verification and security updates will appear here.'} icon={<Ionicons name="checkmark-circle-outline" size={36} color={colors.success} />} />}
      </ScrollView>}
    </Screen>
  );
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  toolbar: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 10, gap: 6, alignItems: 'center' }, filter: { paddingHorizontal: 15, minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border }, active: { backgroundColor: colors.accentSoft, borderColor: colors.accent }, filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, activeText: { color: colors.accent }, mark: { minHeight: 38, paddingHorizontal: 13 }, badge: { minWidth: 36, height: 30, borderRadius: 999, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: colors.inverse, fontWeight: '800', fontSize: 12 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 18, paddingBottom: 45, gap: 14 }, errorCard: { padding: 14 }, error: { color: colors.danger, lineHeight: 18, fontSize: 10 }, group: { gap: 8 }, groupTitle: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase', marginLeft: 4 }, item: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }, unread: { borderColor: colors.accent }, icon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, type: { color: colors.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }, time: { color: colors.muted, fontSize: 9 }, title: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 6 }, message: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }, dot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.accent, marginLeft: 2 },
}); }
