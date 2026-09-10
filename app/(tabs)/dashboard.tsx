import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, ui } from '@/components/ui';
import { sellerApi } from '@/src/lib/api';
import { colors } from '@/src/theme';
import type { Workspace } from '@/src/types';

export default function Dashboard() {
  const [data, setData] = useState<Workspace | null>(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { setData(await sellerApi.workspace()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load your workspace.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <Screen><Header eyebrow="SELLER COMMAND CENTER" title={`Welcome${data?.profile?.displayName || data?.profile?.name ? `, ${(data.profile.displayName || data.profile.name)?.split(' ')[0]}` : ''}`} />
    {loading ? <View style={styles.loader}><IOSSpinner size={34} /></View> : <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} />} contentContainerStyle={ui.content}>
      {error ? <GlassCard style={styles.error}><Text style={styles.errorText}>{error}</Text><PrimaryButton tone="quiet" onPress={() => load()}>Try again</PrimaryButton></GlassCard> : null}
      <GlassCard style={styles.hero}><View style={styles.heroTop}><View><Text style={ui.label}>ACCOUNT STATUS</Text><Text style={styles.business}>{data?.profile.businessName || data?.profile.displayName || 'Auronix Seller'}</Text></View><StatusPill value={data?.profile.status || data?.application?.status || 'Active'} /></View><Text style={styles.heroBody}>Your products, supplier documents, updates, and support are synchronized with AuronixCommerce.com.</Text></GlassCard>
      <View style={styles.metrics}>{[
        ['cube-outline', 'Products', data?.products.length || 0], ['documents-outline', 'Catalogs', data?.catalogs.length || 0], ['ticket-outline', 'Tickets', data?.tickets.length || 0]
      ].map(([icon, label, value]) => <GlassCard key={String(label)} style={styles.metric}><Ionicons name={icon as any} color={colors.accent} size={20} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></GlassCard>)}</View>
      <Text style={ui.sectionTitle}>Next actions</Text>
      <GlassCard>{[
        ['Add a product', 'Create a draft product record', 'cube-outline', '/(tabs)/workspace'], ['Review updates', 'Verification, catalog and support news', 'notifications-outline', '/(tabs)/notifications'], ['Contact support', 'Create and track a support request', 'headset-outline', '/(tabs)/support']
      ].map(([title, body, icon, href], index) => <PrimaryButton key={title} tone="quiet" style={[styles.action, index > 0 && styles.actionBorder]} onPress={() => router.push(href as any)}><Ionicons name={icon as any} size={21} color={colors.accent} /><View style={{ flex: 1 }}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionBody}>{body}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></PrimaryButton>)}</GlassCard>
      <Text style={styles.synced}>Last synced {data?.serverTime ? new Date(data.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</Text>
    </ScrollView>}
  </Screen>;
}

const styles = StyleSheet.create({ loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, error: { padding: 18, gap: 14 }, errorText: { color: colors.danger, lineHeight: 20 }, hero: { padding: 20 }, heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, business: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 7, maxWidth: 220 }, heroBody: { color: colors.muted, lineHeight: 21, marginTop: 16 }, metrics: { flexDirection: 'row', gap: 9 }, metric: { flex: 1, padding: 14, minHeight: 116 }, metricValue: { color: colors.ink, fontSize: 26, fontWeight: '800', marginTop: 12 }, metricLabel: { color: colors.muted, fontSize: 11, marginTop: 2 }, action: { flexDirection: 'row', justifyContent: 'flex-start', gap: 13, borderRadius: 0, minHeight: 70 }, actionBorder: { borderTopWidth: 1, borderTopColor: colors.border }, actionTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', textAlign: 'left' }, actionBody: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'left' }, synced: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 4 } });
