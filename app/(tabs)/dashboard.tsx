import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, LiveIndicator, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
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
  const status = data?.profile.status || data?.application?.status || 'Active';

  return (
    <Screen>
      <Header
        eyebrow="SELLER COMMAND CENTER"
        title={`Welcome${firstName ? `, ${firstName.split(' ')[0]}` : ''}`}
        action={
          <PrimaryButton style={styles.headerAI} onPress={() => router.push('/support/chat')}>
            <Ionicons name="sparkles" color={colors.inverse} size={20} />
          </PrimaryButton>
        }
      />
      {loading ? (
        <View style={styles.loader}><IOSSpinner size={34} /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} colors={[colors.accent]} />}
          contentContainerStyle={ui.content}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <GlassCard style={styles.error}>
              <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" color={colors.danger} size={22} /></View>
              <View style={{ flex: 1 }}><Text style={styles.errorTitle}>Workspace sync interrupted</Text><Text style={styles.errorText}>{error}</Text></View>
              <PrimaryButton tone="quiet" style={styles.retry} onPress={() => void load()}><Ionicons name="refresh" size={18} color={colors.ink} /></PrimaryButton>
            </GlassCard>
          ) : null}

          <GlassCard style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={ui.label}>ACCOUNT STATUS</Text>
                <Text style={styles.business}>{data?.profile.businessName || data?.profile.displayName || 'Auronix Seller'}</Text>
              </View>
              <StatusPill value={status} />
            </View>
            <Text style={styles.heroBody}>Products, catalogs, account updates, and support stay synchronized with your Auronix Commerce seller workspace.</Text>
            <View style={styles.syncRow}><LiveIndicator label="LIVE WORKSPACE" /><Text style={styles.syncMeta}>Secure Firebase session</Text></View>
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

          <LinearGradient
            colors={[colors.accentStrong, '#075EA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.intelligence}
          >
            <View pointerEvents="none" style={styles.intelligenceGlow} />
            <View style={styles.intelligenceTop}>
              <View style={styles.sparkleBox}><Ionicons name="sparkles" size={20} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.intelligenceEyebrow}>AURONIX INTELLIGENCE</Text>
                <Text style={styles.intelligenceTitle}>Ask. Decide. Move faster.</Text>
              </View>
            </View>
            <Text style={styles.intelligenceBody}>Get guided help with seller access, verification, catalogs, products, support, and your next operational step.</Text>
            <PrimaryButton tone="quiet" style={styles.askButton} onPress={() => router.push('/support/chat')}>
              <Text style={styles.askText}>Open Auronix AI</Text>
              <Ionicons name="arrow-forward" size={17} color="#fff" />
            </PrimaryButton>
          </LinearGradient>

          <View style={styles.sectionHead}>
            <Text style={ui.sectionTitle}>Next actions</Text>
            <Text style={styles.sectionMeta}>READY</Text>
          </View>
          <GlassCard>
            {[
              ['Add a product', 'Create or manage seller inventory records', 'cube-outline', '/(tabs)/workspace'],
              ['Review updates', 'Verification, catalog and support activity', 'notifications-outline', '/(tabs)/notifications'],
              ['Contact support', 'Create and track a secure support request', 'headset-outline', '/(tabs)/support'],
            ].map(([title, body, icon, href], index) => (
              <PrimaryButton key={title} tone="quiet" style={[styles.action, index > 0 && styles.actionBorder]} onPress={() => router.push(href as any)}>
                <View style={styles.actionIcon}><Ionicons name={icon as any} size={20} color={colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionBody}>{body}</Text></View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </PrimaryButton>
            ))}
          </GlassCard>

          <View style={styles.footerState}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
            <Text style={styles.synced}>Last synced {data?.serverTime ? new Date(data.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</Text>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerAI: { width: 46, minHeight: 46, paddingHorizontal: 0, borderRadius: 17 },
    error: { padding: 15, gap: 12, flexDirection: 'row', alignItems: 'center' },
    errorIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft },
    errorTitle: { color: colors.ink, fontWeight: '800', fontSize: 13 },
    errorText: { color: colors.danger, lineHeight: 17, fontSize: 11, marginTop: 3 },
    retry: { width: 42, minHeight: 42, paddingHorizontal: 0 },
    hero: { padding: 20 },
    heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    business: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 7, maxWidth: 240, letterSpacing: -0.5 },
    heroBody: { color: colors.muted, lineHeight: 21, marginTop: 16 },
    syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 18 },
    syncMeta: { color: colors.muted, fontSize: 9, fontWeight: '700' },
    metrics: { flexDirection: 'row', gap: 9 },
    metric: { flex: 1, padding: 14, minHeight: 126 },
    metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
    metricValue: { color: colors.ink, fontSize: 27, fontWeight: '900', marginTop: 12 },
    metricLabel: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
    intelligence: { borderRadius: 27, padding: 19, overflow: 'hidden', shadowColor: colors.accentStrong, shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 11 }, elevation: 9 },
    intelligenceGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.10)', top: -110, right: -45 },
    intelligenceTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sparkleBox: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
    intelligenceEyebrow: { color: 'rgba(255,255,255,.68)', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
    intelligenceTitle: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: -0.4, marginTop: 3 },
    intelligenceBody: { color: 'rgba(255,255,255,.78)', fontSize: 12, lineHeight: 18, marginTop: 15 },
    askButton: { marginTop: 16, minHeight: 45, backgroundColor: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.18)', flexDirection: 'row', gap: 8 },
    askText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionMeta: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
    action: { flexDirection: 'row', justifyContent: 'flex-start', gap: 13, borderRadius: 0, minHeight: 76, borderWidth: 0 },
    actionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    actionIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
    actionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'left' },
    actionBody: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'left' },
    footerState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
    synced: { color: colors.muted, fontSize: 10 },
  });
}
