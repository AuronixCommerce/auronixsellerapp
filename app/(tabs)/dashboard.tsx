import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { sellerApi } from '@/src/lib/api';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';
import type { Workspace } from '@/src/types';

export default function Dashboard() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setData(await sellerApi.workspace());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load your workspace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const firstName = data?.profile?.displayName || data?.profile?.name;

  return (
    <Screen>
      <Header eyebrow="SELLER COMMAND CENTER" title={`Welcome${firstName ? `, ${firstName.split(' ')[0]}` : ''}`} />
      {loading ? (
        <View style={styles.loader}><IOSSpinner size={34} /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} colors={[colors.accent]} />}
          contentContainerStyle={ui.content}
        >
          {error ? <GlassCard style={styles.error}><Text style={styles.errorText}>{error}</Text><PrimaryButton tone="quiet" onPress={() => load()}>Try again</PrimaryButton></GlassCard> : null}

          <GlassCard style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={ui.label}>ACCOUNT STATUS</Text>
                <Text style={styles.business}>{data?.profile.businessName || data?.profile.displayName || 'Auronix Seller'}</Text>
              </View>
              <StatusPill value={data?.profile.status || data?.application?.status || 'Active'} />
            </View>
            <Text style={styles.heroBody}>Your products, supplier documents, updates, and support stay synchronized with AuronixCommerce.com.</Text>
            <View style={styles.syncRow}><View style={styles.liveDot} /><Text style={styles.syncText}>Live workspace connected</Text></View>
          </GlassCard>

          <View style={styles.metrics}>
            {[
              ['cube-outline', 'Products', data?.products.length || 0],
              ['documents-outline', 'Catalogs', data?.catalogs.length || 0],
              ['ticket-outline', 'Tickets', data?.tickets.length || 0],
            ].map(([icon, label, value]) => (
              <GlassCard key={String(label)} style={styles.metric}>
                <View style={styles.metricIcon}><Ionicons name={icon as any} color={colors.accent} size={19} /></View>
                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricLabel}>{label}</Text>
              </GlassCard>
            ))}
          </View>

          <Text style={ui.sectionTitle}>Next actions</Text>
          <GlassCard>
            {[
              ['Add a product', 'Create a draft product record', 'cube-outline', '/(tabs)/workspace'],
              ['Review updates', 'Verification, catalog and support news', 'notifications-outline', '/(tabs)/notifications'],
              ['Contact support', 'Create and track a support request', 'headset-outline', '/(tabs)/support'],
            ].map(([title, body, icon, href], index) => (
              <PrimaryButton key={title} tone="quiet" style={[styles.action, index > 0 && styles.actionBorder]} onPress={() => router.push(href as any)}>
                <View style={styles.actionIcon}><Ionicons name={icon as any} size={20} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionBody}>{body}</Text></View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </PrimaryButton>
            ))}
          </GlassCard>

          <Text style={styles.synced}>Last synced {data?.serverTime ? new Date(data.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</Text>
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    error: { padding: 18, gap: 14 },
    errorText: { color: colors.danger, lineHeight: 20 },
    hero: { padding: 20 },
    heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    business: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 7, maxWidth: 240, letterSpacing: -0.5 },
    heroBody: { color: colors.muted, lineHeight: 21, marginTop: 16 },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17 },
    liveDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.success },
    syncText: { color: colors.success, fontSize: 11, fontWeight: '800' },
    metrics: { flexDirection: 'row', gap: 9 },
    metric: { flex: 1, padding: 14, minHeight: 126 },
    metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
    metricValue: { color: colors.ink, fontSize: 27, fontWeight: '900', marginTop: 12 },
    metricLabel: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
    action: { flexDirection: 'row', justifyContent: 'flex-start', gap: 13, borderRadius: 0, minHeight: 74, borderWidth: 0 },
    actionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    actionIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
    actionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'left' },
    actionBody: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'left' },
    synced: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  });
}
