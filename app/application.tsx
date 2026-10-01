import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { sellerService } from '@/src/services/seller-service';
import type { AppColors } from '@/src/theme';
import type { SellerOverview } from '@/src/types';

export default function ApplicationStatus() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [data, setData] = useState<SellerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try { setData((await sellerService.overview(force)).data); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load application status.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  const application = data?.application;
  const status = application?.status || data?.profile.status || 'Active';
  const requested = Array.isArray(application?.requestedFields) ? application?.requestedFields : [];

  return <Screen>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>SELLER VERIFICATION</Text><Text style={styles.title}>Application</Text></View><StatusPill value={status} /></View>
    {loading && !data ? <View style={styles.loader}><IOSSpinner /></View> : <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load(true)}>Retry</PrimaryButton></GlassCard> : null}
      <GlassCard style={styles.hero}><Text style={ui.label}>APPLICATION STATUS</Text><Text style={styles.business}>{application?.businessName || data?.profile.businessName || 'Seller account'}</Text><Text style={styles.reference}>Reference: {application?.referenceId || application?.id || data?.profile.sellerApplicationId || 'Not available'}</Text>{application?.updatedAt ? <Text style={styles.updated}>Updated {new Date(application.updatedAt).toLocaleString()}</Text> : null}</GlassCard>

      <Text style={ui.sectionTitle}>Verification timeline</Text>
      <GlassCard style={styles.timeline}>{data?.verification.map((step, index) => <View key={step.key} style={styles.step}><View style={styles.stepRail}>{index < (data.verification.length - 1) ? <View style={[styles.line, step.complete && styles.lineDone]} /> : null}<View style={[styles.dot, step.complete && styles.dotDone]}>{step.complete ? <Ionicons name="checkmark" size={12} color={colors.inverse} /> : <Text style={styles.dotText}>{index + 1}</Text>}</View></View><View style={styles.stepBody}><Text style={[styles.stepTitle, step.complete && { color: colors.ink }]}>{step.label}</Text><Text style={styles.stepMeta}>{step.complete ? 'Completed' : index === data.verification.findIndex(item => !item.complete) ? 'Current step' : 'Pending'}</Text></View></View>)}</GlassCard>

      {application?.reviewMessage || requested.length ? <><Text style={ui.sectionTitle}>Requested changes</Text><GlassCard style={styles.changes}>{application.reviewMessage ? <Text style={styles.reviewMessage}>{application.reviewMessage}</Text> : null}{requested.map(field => <View key={field} style={styles.changeRow}><Ionicons name="alert-circle-outline" size={17} color={colors.warning} /><Text style={styles.changeText}>{String(field).replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim()}</Text></View>)}<Text style={styles.helper}>Requested application edits remain tied to your existing seller application. Contact support if a field cannot be updated from your current seller access.</Text><PrimaryButton onPress={() => router.push('/(tabs)/support')}>Contact Support</PrimaryButton></GlassCard></> : null}

      <Text style={ui.sectionTitle}>Account verification</Text>
      <GlassCard style={styles.checks}><View style={styles.checkRow}><Ionicons name={data?.profile.emailVerified || application?.emailVerified ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={data?.profile.emailVerified || application?.emailVerified ? colors.success : colors.muted} /><View style={{ flex: 1 }}><Text style={styles.checkTitle}>Email</Text><Text style={styles.checkMeta}>{data?.profile.emailVerified || application?.emailVerified ? 'Verified' : 'Verification not recorded'}</Text></View></View><View style={styles.divider} /><View style={styles.checkRow}><Ionicons name={application?.documentsVerified || application?.documentsApproved ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={application?.documentsVerified || application?.documentsApproved ? colors.success : colors.muted} /><View style={{ flex: 1 }}><Text style={styles.checkTitle}>Documents</Text><Text style={styles.checkMeta}>{application?.documentsVerified || application?.documentsApproved ? 'Verified' : 'No completed document verification recorded'}</Text></View><Pressable onPress={() => router.push('/documents')}><Text style={styles.link}>Documents</Text></Pressable></View></GlassCard>

      <GlassCard style={styles.notice}><Ionicons name="information-circle-outline" size={21} color={colors.accent} /><Text style={styles.noticeText}>This screen reflects the real seller profile and application records already used by the Auronix website. Missing verification values are shown as unavailable rather than inferred.</Text></GlassCard>
    </ScrollView>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }, back: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 2 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 18, paddingBottom: 45, gap: 13 }, errorCard: { padding: 14, gap: 10 }, error: { color: colors.danger, fontSize: 10, lineHeight: 15 }, hero: { padding: 18 }, business: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 6 }, reference: { color: colors.muted, fontSize: 10, marginTop: 9 }, updated: { color: colors.muted, fontSize: 8, marginTop: 5 }, timeline: { padding: 16, gap: 0 }, step: { minHeight: 58, flexDirection: 'row', gap: 12 }, stepRail: { width: 28, alignItems: 'center' }, line: { position: 'absolute', top: 27, bottom: -1, width: 2, backgroundColor: colors.borderStrong }, lineDone: { backgroundColor: colors.success }, dot: { width: 27, height: 27, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }, dotDone: { backgroundColor: colors.success, borderColor: colors.success }, dotText: { color: colors.muted, fontSize: 9, fontWeight: '900' }, stepBody: { flex: 1, paddingTop: 4 }, stepTitle: { color: colors.muted, fontSize: 12, fontWeight: '800' }, stepMeta: { color: colors.muted, fontSize: 8, marginTop: 4 }, changes: { padding: 16, gap: 10 }, reviewMessage: { color: colors.ink, fontSize: 11, lineHeight: 17, fontWeight: '700' }, changeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: 13, padding: 10 }, changeText: { color: colors.warning, fontSize: 10, fontWeight: '800', flex: 1, textTransform: 'capitalize' }, helper: { color: colors.muted, fontSize: 9, lineHeight: 14 }, checks: { paddingHorizontal: 15 }, checkRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11 }, divider: { height: 1, backgroundColor: colors.border }, checkTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' }, checkMeta: { color: colors.muted, fontSize: 8, marginTop: 3 }, link: { color: colors.accent, fontSize: 9, fontWeight: '900' }, notice: { padding: 15, flexDirection: 'row', gap: 10 }, noticeText: { color: colors.muted, fontSize: 9, lineHeight: 14, flex: 1 },
}); }
