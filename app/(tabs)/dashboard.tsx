import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DashboardSkeleton } from '@/components/skeleton';
import { GlassCard, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { sellerService } from '@/src/services/seller-service';
import type { AnalyticsPoint, AppColors, SellerOverview } from '@/src/types';

type Range = 'Today' | '7 Days' | '30 Days' | 'This Month';
type Metric = 'revenue' | 'sales' | 'profit';
const ranges: Range[] = ['Today', '7 Days', '30 Days', 'This Month'];
const metrics: { key: Metric; label: string }[] = [{ key: 'revenue', label: 'Revenue' }, { key: 'sales', label: 'Sales' }, { key: 'profit', label: 'Profit' }];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function rangeStart(range: Range) {
  const now = new Date();
  if (range === 'Today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (range === '7 Days') return Date.now() - 7 * 86400000;
  if (range === '30 Days') return Date.now() - 30 * 86400000;
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function pointTime(point: AnalyticsPoint) {
  if (point.timestamp) return Number(point.timestamp);
  const parsed = point.date ? Date.parse(point.date) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Dashboard() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [data, setData] = useState<SellerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [syncedAt, setSyncedAt] = useState(0);
  const [range, setRange] = useState<Range>('7 Days');
  const [metric, setMetric] = useState<Metric>('revenue');

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const result = await sellerService.overview(force);
      setData(result.data);
      setCached(result.cached);
      setSyncedAt(result.syncedAt);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your seller overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  const name = data?.profile.displayName || data?.profile.name || 'Seller';
  const firstName = name.split(' ')[0];
  const series = useMemo(() => (data?.summary.series || []).filter(point => pointTime(point) >= rangeStart(range)), [data?.summary.series, range]);
  const maxChart = Math.max(1, ...series.map(point => Number(point[metric] || 0)));
  const verificationComplete = data?.verification.filter(step => step.complete).length || 0;
  const verificationTotal = data?.verification.length || 1;

  const summary = [
    { label: 'Revenue', value: money(data?.summary.revenue), icon: 'wallet-outline' as const, available: data?.dataAvailability.analytics },
    { label: 'Profit', value: money(data?.summary.profit), icon: 'trending-up-outline' as const, available: data?.dataAvailability.analytics },
    { label: 'Active', value: String(data?.summary.activeProducts ?? 0), icon: 'cube-outline' as const, available: true },
    { label: 'Inventory', value: money(data?.summary.inventoryValue), icon: 'layers-outline' as const, available: data?.dataAvailability.inventoryValue },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text>
          <Text style={styles.greeting}>{greeting()}, {firstName}</Text>
        </View>
        <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/(tabs)/notifications')} style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={21} color={colors.ink} />
          {data?.latestUpdates.some(item => !item.readAt) ? <View style={styles.notificationDot} /> : null}
        </Pressable>
      </View>

      {loading && !data ? <DashboardSkeleton /> : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />}
          contentContainerStyle={ui.content}
          showsVerticalScrollIndicator={false}
        >
          {cached ? <View style={styles.offlineBanner}><Ionicons name="cloud-offline-outline" size={14} color={colors.warning} /><Text style={styles.offlineText}>Saved data · last synced {syncedAt ? new Date(syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier'}</Text></View> : null}
          {error ? <GlassCard style={styles.error}><Text style={styles.errorText}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load(true)}>Retry</PrimaryButton></GlassCard> : null}

          <GlassCard style={styles.accountCard}>
            <View style={styles.accountTop}>
              <View><Text style={ui.label}>SELLER ACCOUNT</Text><Text style={styles.business}>{data?.profile.businessName || name}</Text></View>
              <StatusPill value={data?.profile.status || data?.application?.status || 'Active'} />
            </View>
            <View style={styles.healthRow}><Ionicons name="shield-checkmark-outline" size={16} color={colors.success} /><Text style={styles.healthText}>{verificationComplete === verificationTotal ? 'Seller setup verified' : `${verificationComplete} of ${verificationTotal} verification steps complete`}</Text></View>
          </GlassCard>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
            {ranges.map(item => <Pressable key={item} onPress={() => setRange(item)} style={[styles.range, range === item && styles.rangeActive]}><Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{item}</Text></Pressable>)}
          </ScrollView>

          <View style={styles.metricsGrid}>
            {summary.map(item => <GlassCard key={item.label} style={styles.metricCard}><View style={styles.metricIcon}><Ionicons name={item.icon} size={18} color={colors.accent} /></View><Text style={styles.metricValue}>{item.value}</Text><Text style={styles.metricLabel}>{item.label}</Text>{!item.available ? <Text style={styles.unavailable}>No live data yet</Text> : null}</GlassCard>)}
          </View>

          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHead}><View><Text style={ui.label}>PERFORMANCE</Text><Text style={ui.sectionTitle}>{metrics.find(item => item.key === metric)?.label}</Text></View><View style={styles.metricSwitch}>{metrics.map(item => <Pressable key={item.key} onPress={() => setMetric(item.key)} style={[styles.metricChip, metric === item.key && styles.metricChipActive]}><Text style={[styles.metricChipText, metric === item.key && styles.metricChipTextActive]}>{item.label}</Text></Pressable>)}</View></View>
            {data?.dataAvailability.analytics && series.length ? <View style={styles.chart}>{series.slice(-24).map((point, index) => <View key={`${point.date || point.timestamp}-${index}`} style={[styles.bar, { height: Math.max(4, (Number(point[metric] || 0) / maxChart) * 112) }]} />)}</View> : <View style={styles.chartEmpty}><Ionicons name="analytics-outline" size={25} color={colors.muted} /><Text style={styles.chartEmptyTitle}>Analytics will appear here</Text><Text style={styles.chartEmptyBody}>Revenue, sales and profit stay blank until real seller analytics are recorded.</Text></View>}
          </GlassCard>

          {data?.productsNeedingAttention.length ? <><View style={styles.sectionHead}><Text style={ui.sectionTitle}>Needs attention</Text><Pressable onPress={() => router.push('/(tabs)/products')}><Text style={styles.link}>View products</Text></Pressable></View>{data.productsNeedingAttention.slice(0, 4).map(product => <Pressable key={product.id} onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}><GlassCard style={styles.attentionCard}><View style={styles.attentionIcon}><Ionicons name="alert-circle-outline" size={20} color={colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.attentionTitle}>{product.name}</Text><Text style={styles.attentionBody}>{product.attention?.join(' · ')}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.muted} /></GlassCard></Pressable>)}</> : null}

          <Text style={ui.sectionTitle}>Quick actions</Text>
          <View style={styles.quickGrid}>
            {[
              ['Add Product', 'add-circle-outline', () => router.push('/products/new')],
              ['Products', 'cube-outline', () => router.push('/(tabs)/products')],
              ['Catalogs', 'documents-outline', () => router.push('/(tabs)/catalogs')],
              ['Ask AI', 'sparkles-outline', () => router.push('/(tabs)/ai')],
              ['Support', 'headset-outline', () => router.push('/(tabs)/support')],
              ['More', 'grid-outline', () => router.push('/(tabs)/more')],
            ].map(([label, icon, action]) => <Pressable key={String(label)} onPress={action as () => void} style={styles.quickAction}><View style={styles.quickIcon}><Ionicons name={icon as any} size={21} color={colors.accent} /></View><Text style={styles.quickText}>{label as string}</Text></Pressable>)}
          </View>

          {data?.openTickets.length ? <><Text style={ui.sectionTitle}>Open support</Text>{data.openTickets.slice(0, 3).map(ticket => <GlassCard key={ticket.id} style={styles.ticket}><View style={{ flex: 1 }}><Text style={styles.ticketTitle}>{ticket.subject}</Text><Text style={styles.ticketMeta}>{ticket.priority || 'Normal'} · {ticket.status || 'Open'}</Text></View><Ionicons name="chevron-forward" color={colors.muted} size={17} /></GlassCard>)}</> : null}

          {data?.verification ? <><Text style={ui.sectionTitle}>Verification</Text><GlassCard style={styles.verification}>{data.verification.map((step, index) => <View key={step.key} style={styles.step}><View style={[styles.stepDot, step.complete && styles.stepDone]}>{step.complete ? <Ionicons name="checkmark" size={12} color={colors.inverse} /> : <Text style={styles.stepNumber}>{index + 1}</Text>}</View><Text style={[styles.stepText, step.complete && styles.stepTextDone]}>{step.label}</Text></View>)}</GlassCard></> : null}
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, gap: 12 },
    avatar: { width: 46, height: 46, borderRadius: 17, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.inverse, fontWeight: '900', fontSize: 18 },
    date: { color: colors.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
    greeting: { color: colors.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.8, marginTop: 2 },
    headerButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    notificationDot: { position: 'absolute', right: 10, top: 9, width: 7, height: 7, borderRadius: 7, backgroundColor: colors.danger },
    offlineBanner: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 12, minHeight: 36, borderRadius: 14, backgroundColor: colors.warningSoft },
    offlineText: { color: colors.warning, fontSize: 10, fontWeight: '700' },
    error: { padding: 16, gap: 11 }, errorText: { color: colors.danger, fontSize: 12, lineHeight: 18 },
    accountCard: { padding: 19 }, accountTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    business: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 6 },
    healthRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17 }, healthText: { color: colors.success, fontSize: 11, fontWeight: '700' },
    rangeRow: { gap: 7 }, range: { minHeight: 36, paddingHorizontal: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
    rangeActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent }, rangeText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, rangeTextActive: { color: colors.accent },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, metricCard: { width: '48.5%', minHeight: 126, padding: 15 },
    metricIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
    metricValue: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 11 }, metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 }, unavailable: { color: colors.muted, fontSize: 8, marginTop: 5 },
    chartCard: { padding: 17 }, chartHead: { gap: 12 }, metricSwitch: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' }, metricChip: { minHeight: 31, paddingHorizontal: 10, borderRadius: 999, justifyContent: 'center', backgroundColor: colors.surfaceSoft }, metricChipActive: { backgroundColor: colors.accentSoft }, metricChipText: { color: colors.muted, fontSize: 9, fontWeight: '800' }, metricChipTextActive: { color: colors.accent },
    chart: { height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 15 }, bar: { flex: 1, minWidth: 3, borderRadius: 4, backgroundColor: colors.accent },
    chartEmpty: { minHeight: 135, alignItems: 'center', justifyContent: 'center', padding: 18 }, chartEmptyTitle: { color: colors.ink, fontWeight: '800', marginTop: 8 }, chartEmptyBody: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 4 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, link: { color: colors.accent, fontSize: 11, fontWeight: '800' },
    attentionCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, attentionIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' }, attentionTitle: { color: colors.ink, fontWeight: '800', fontSize: 13 }, attentionBody: { color: colors.muted, fontSize: 10, marginTop: 3 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, quickAction: { width: '31.6%', minHeight: 91, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 20, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border }, quickIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, quickText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
    ticket: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }, ticketTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, ticketMeta: { color: colors.muted, fontSize: 9, marginTop: 4, textTransform: 'capitalize' },
    verification: { padding: 16, gap: 12 }, step: { flexDirection: 'row', alignItems: 'center', gap: 11 }, stepDot: { width: 26, height: 26, borderRadius: 10, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, stepDone: { backgroundColor: colors.success, borderColor: colors.success }, stepNumber: { color: colors.muted, fontSize: 9, fontWeight: '900' }, stepText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, stepTextDone: { color: colors.ink },
  });
}
