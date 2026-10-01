import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppLock } from '@/src/context/app-lock';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';
import { securityService, type SecuritySnapshot } from '@/src/services/security-service';
import type { AppColors } from '@/src/theme';

export default function SecurityCenter() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { logout } = useAuth();
  const { ready: lockReady, available, enabled, biometricName, setEnabled, lockNow } = useAppLock();
  const [data, setData] = useState<SecuritySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await securityService.heartbeat();
      setData(await securityService.snapshot());
      setError('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load security information.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function toggle(next: boolean) {
    setMessage('');
    const ok = await setEnabled(next);
    setMessage(ok ? `${biometricName} App Lock ${next ? 'enabled' : 'disabled'}.` : available ? 'Authentication was cancelled.' : 'Biometrics are not enrolled on this device.');
  }

  async function resetPassword() {
    setBusy('password'); setMessage('');
    try { const email = await securityService.requestPasswordReset(); setMessage(`Password reset email sent to ${email}.`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to send password reset email.'); }
    finally { setBusy(''); }
  }

  function revokeAll() {
    Alert.alert('Sign out every seller session?', 'All Auronix Seller refresh sessions will be revoked. You will need to sign in again on every device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke all sessions', style: 'destructive', onPress: () => void doRevoke() },
    ]);
  }
  async function doRevoke() {
    setBusy('revoke');
    try {
      await securityService.revokeAll();
      await logout();
      router.replace('/login');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to revoke sessions.'); setBusy(''); }
  }

  function removeDevice(id: string, label: string) {
    Alert.alert('Remove device history?', `${label} will be removed from this account’s recorded app installations. This does not remotely wipe the device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void (async () => { setBusy(id); try { await securityService.removeDevice(id); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to remove device.'); } finally { setBusy(''); } })() },
    ]);
  }

  return <Screen>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View><Text style={styles.kicker}>ACCOUNT PROTECTION</Text><Text style={styles.title}>Security</Text></View></View>
    {loading && !data ? <View style={styles.loader}><IOSSpinner /></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load()}>Retry</PrimaryButton></GlassCard> : null}
      {message ? <GlassCard style={styles.messageCard}><Text style={styles.message}>{message}</Text></GlassCard> : null}

      <Text style={ui.sectionTitle}>App Lock</Text>
      <GlassCard style={styles.settingCard}><View style={styles.settingRow}><View style={styles.icon}><Ionicons name={enabled ? 'shield-checkmark' : 'finger-print'} size={21} color={enabled ? colors.success : colors.accent} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{biometricName} App Lock</Text><Text style={styles.settingBody}>{available ? 'Require device authentication after Auronix Seller leaves the foreground.' : 'Enroll biometrics in device settings to use App Lock.'}</Text></View><Switch value={enabled} disabled={!lockReady || !available} onValueChange={next => void toggle(next)} trackColor={{ false: colors.borderStrong, true: colors.accentStrong }} thumbColor={colors.inverse} /></View>{enabled ? <PrimaryButton tone="quiet" onPress={lockNow}>Lock App Now</PrimaryButton> : null}</GlassCard>

      <Text style={ui.sectionTitle}>Authentication</Text>
      <GlassCard style={styles.detailCard}>
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Email verification</Text><StatusPill value={data?.auth.emailVerified ? 'Verified' : 'Not verified'} /></View>
        <View style={styles.divider} /><View style={styles.detailRow}><Text style={styles.detailLabel}>Last sign-in</Text><Text style={styles.detailValue}>{data?.auth.lastSignInTime ? new Date(data.auth.lastSignInTime).toLocaleString() : 'Unavailable'}</Text></View>
        <View style={styles.divider} /><View style={styles.detailRow}><Text style={styles.detailLabel}>Account created</Text><Text style={styles.detailValue}>{data?.auth.creationTime ? new Date(data.auth.creationTime).toLocaleDateString() : 'Unavailable'}</Text></View>
      </GlassCard>
      <View style={styles.actions}><PrimaryButton tone="quiet" style={styles.action} loading={busy === 'password'} onPress={() => void resetPassword()}><Ionicons name="key-outline" size={18} color={colors.ink} /><Text style={styles.actionText}>Reset password</Text></PrimaryButton><PrimaryButton tone="danger" style={styles.action} loading={busy === 'revoke'} onPress={revokeAll}><Ionicons name="log-out-outline" size={18} color={colors.danger} /><Text style={[styles.actionText, { color: colors.danger }]}>Revoke sessions</Text></PrimaryButton></View>

      <Text style={ui.sectionTitle}>Recorded devices</Text>
      <Text style={styles.helper}>Device history starts when this version of Auronix Seller records an authenticated installation. It is not a complete historical list from before this feature existed.</Text>
      {data?.devices.length ? data.devices.map(device => <GlassCard key={device.id} style={styles.device}><View style={styles.icon}><Ionicons name={device.platform === 'ios' ? 'phone-portrait-outline' : 'logo-android'} size={20} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={styles.deviceTitle}>{device.deviceLabel || 'Seller app device'}</Text><Text style={styles.deviceMeta}>{device.platform} {device.platformVersion || ''} · app {device.appVersion || '—'}</Text><Text style={styles.deviceMeta}>Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'unknown'}</Text></View><Pressable disabled={busy === device.id} onPress={() => removeDevice(device.id, device.deviceLabel || 'this device')} hitSlop={8}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable></GlassCard>) : <GlassCard style={styles.empty}><Text style={styles.helper}>No device history has been recorded yet.</Text></GlassCard>}

      <Text style={ui.sectionTitle}>Security activity</Text>
      {data?.events.length ? <GlassCard>{data.events.slice(0, 15).map((event, index) => <View key={event.id} style={[styles.event, index > 0 && styles.eventBorder]}><View style={styles.eventDot} /><View style={{ flex: 1 }}><Text style={styles.eventTitle}>{event.title || 'Security event'}</Text><Text style={styles.eventMeta}>{event.createdAt ? new Date(event.createdAt).toLocaleString() : ''}</Text></View></View>)}</GlassCard> : <GlassCard style={styles.empty}><Text style={styles.helper}>No recent security events.</Text></GlassCard>}
    </ScrollView>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }, back: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 2 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 18, paddingBottom: 45, gap: 12 }, errorCard: { padding: 14, gap: 10 }, error: { color: colors.danger, fontSize: 10, lineHeight: 15 }, messageCard: { padding: 13 }, message: { color: colors.success, fontSize: 10, lineHeight: 15 }, settingCard: { padding: 15, gap: 12 }, settingRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, icon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, settingTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, settingBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, detailCard: { paddingHorizontal: 15 }, detailRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, detailValue: { color: colors.ink, fontSize: 10, fontWeight: '800', flexShrink: 1, textAlign: 'right' }, divider: { height: 1, backgroundColor: colors.border }, actions: { flexDirection: 'row', gap: 9 }, action: { flex: 1, flexDirection: 'row', gap: 7 }, actionText: { color: colors.ink, fontSize: 10, fontWeight: '800' }, helper: { color: colors.muted, fontSize: 9, lineHeight: 14 }, device: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, deviceTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, deviceMeta: { color: colors.muted, fontSize: 8, marginTop: 3, textTransform: 'capitalize' }, empty: { padding: 18 }, event: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }, eventBorder: { borderTopWidth: 1, borderTopColor: colors.border }, eventDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.success }, eventTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' }, eventMeta: { color: colors.muted, fontSize: 8, marginTop: 3 },
}); }
