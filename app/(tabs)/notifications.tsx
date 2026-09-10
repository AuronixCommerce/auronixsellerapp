import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, GlassCard, Header, IOSSpinner, PrimaryButton, Screen, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { sellerApi } from '@/src/lib/api';
import type { AppColors } from '@/src/theme';
import type { SellerNotification } from '@/src/types';

export default function Notifications() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load updates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const shown = useMemo(() => filter === 'Unread' ? items.filter((item) => !item.readAt) : items, [filter, items]);
  const unread = items.filter((item) => !item.readAt).length;

  async function mark(id?: string) {
    try {
      await sellerApi.markNotification(id);
      setItems((current) => current.map((item) => !id || item.id === id ? { ...item, readAt: Date.now() } : item));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update notifications.');
    }
  }

  return (
    <Screen>
      <Header eyebrow="REALTIME SELLER UPDATES" title="Notifications" action={unread ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null} />
      <View style={styles.toolbar}>
        {(['All', 'Unread'] as const).map((value) => (
          <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.active]}>
            <Text style={[styles.filterText, filter === value && styles.activeText]}>{value}</Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        {unread ? <PrimaryButton tone="quiet" style={styles.mark} onPress={() => void mark()}>Mark all read</PrimaryButton> : null}
      </View>

      {loading ? <View style={styles.loader}><IOSSpinner /></View> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />} contentContainerStyle={ui.content}>
          {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text></GlassCard> : null}
          {shown.length ? shown.map((item) => (
            <Pressable key={item.id} onPress={() => { if (!item.readAt) void mark(item.id); }}>
              <GlassCard style={[styles.item, !item.readAt ? styles.unread : undefined]}>
                <View style={styles.icon}><Ionicons name={item.type?.includes('support') ? 'chatbubble-ellipses-outline' : item.type?.includes('catalog') ? 'documents-outline' : 'shield-checkmark-outline'} size={21} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.meta}><Text style={styles.type}>{item.type || 'Account update'}</Text>{item.createdAt ? <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text> : null}</View>
                  <Text style={styles.title}>{item.title || 'Seller update'}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                </View>
                {!item.readAt ? <View style={styles.dot} /> : null}
              </GlassCard>
            </Pressable>
          )) : <EmptyState title="You’re all caught up" body={filter === 'Unread' ? 'There are no unread notifications.' : 'Account, verification, catalog and support updates will appear here.'} icon={<Ionicons name="checkmark-circle-outline" size={36} color={colors.success} />} />}
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    toolbar: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 15, gap: 6, alignItems: 'center' },
    filter: { paddingHorizontal: 15, minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border },
    active: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
    filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    activeText: { color: colors.accent },
    mark: { minHeight: 38, paddingHorizontal: 13 },
    badge: { minWidth: 36, height: 30, borderRadius: 999, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: colors.inverse, fontWeight: '800', fontSize: 12 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorCard: { padding: 14 },
    error: { color: colors.danger, lineHeight: 18 },
    item: { padding: 16, flexDirection: 'row', gap: 13 },
    unread: { borderColor: colors.accent },
    icon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
    meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    type: { color: colors.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    time: { color: colors.muted, fontSize: 10 },
    title: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 7 },
    message: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
    dot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.accent, marginTop: 5 },
  });
}
