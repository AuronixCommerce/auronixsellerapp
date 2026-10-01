import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { notificationService, type NotificationPreferences } from '@/src/services/notification-service';
import type { AppColors } from '@/src/theme';

const rows: { key: keyof Pick<NotificationPreferences, 'account' | 'products' | 'catalogs' | 'support' | 'security' | 'marketing'>; title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'account', title: 'Account updates', body: 'Seller status, verification and account changes', icon: 'person-circle-outline' },
  { key: 'products', title: 'Products & inventory', body: 'Product review, listing and inventory alerts', icon: 'cube-outline' },
  { key: 'catalogs', title: 'Catalogs', body: 'Upload processing and catalog-analysis results', icon: 'documents-outline' },
  { key: 'support', title: 'Support', body: 'Ticket replies and support status changes', icon: 'headset-outline' },
  { key: 'security', title: 'Security', body: 'Session and security-sensitive account activity', icon: 'shield-checkmark-outline' },
  { key: 'marketing', title: 'Product news', body: 'Optional Auronix product announcements', icon: 'megaphone-outline' },
];

export default function NotificationSettings() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const expoGo = notificationService.isExpoGo();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [remote, system] = await Promise.all([notificationService.preferences(), notificationService.systemPermission()]);
      setPrefs(remote.preferences);
      setPermission(system.granted);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load notification settings.');
    }
  }

  useEffect(() => { void load(); }, []);

  async function toggle(key: keyof NotificationPreferences, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setBusy(String(key));
    try {
      const result = await notificationService.updatePreferences({ [key]: value });
      setPrefs(result.preferences);
      setError('');
    } catch (caught) {
      setPrefs(prefs);
      setError(caught instanceof Error ? caught.message : 'Unable to update notification settings.');
    } finally { setBusy(''); }
  }

  async function enableDevicePush() {
    if (expoGo) {
      setError('Remote push is disabled inside Expo Go. Install an Auronix development or preview build to test real device notifications.');
      return;
    }
    setBusy('device'); setError('');
    try {
      const result = await notificationService.register();
      setPermission(result.registered);
      if (!result.registered) {
        setError(result.reason === 'permission-denied'
          ? 'Notifications are disabled for Auronix Seller in your device settings.'
          : result.reason === 'expo-go'
            ? 'Remote push is disabled inside Expo Go. Use an Auronix development build.'
            : 'Push notifications need a configured EAS project ID in the standalone build.');
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to enable device notifications.'); }
    finally { setBusy(''); }
  }

  return <Screen>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>NOTIFICATION CONTROL</Text><Text style={styles.title}>Notifications</Text></View></View>
    {!prefs ? <View style={styles.loader}><IOSSpinner /></View> : <ScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.deviceCard}><View style={[styles.deviceIcon, { backgroundColor: permission ? colors.successSoft : expoGo ? colors.accentSoft : colors.warningSoft }]}><Ionicons name={permission ? 'notifications' : expoGo ? 'flask-outline' : 'notifications-off-outline'} size={22} color={permission ? colors.success : expoGo ? colors.accent : colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.deviceTitle}>{permission ? 'Device notifications enabled' : expoGo ? 'Expo Go preview mode' : 'Device notifications unavailable'}</Text><Text style={styles.deviceBody}>{permission ? 'This device can receive seller push notifications.' : expoGo ? 'The app remains fully usable here. Remote push activates in the Auronix development/preview/production build.' : 'Enable system notification permission to receive seller updates outside the app.'}</Text></View>{!permission && !expoGo ? <PrimaryButton loading={busy === 'device'} style={styles.enableButton} onPress={() => void enableDevicePush()}>Enable</PrimaryButton> : null}</GlassCard>
      {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text></GlassCard> : null}
      <Text style={ui.sectionTitle}>What reaches you</Text>
      <GlassCard style={styles.list}>{rows.map((row, index) => <View key={row.key} style={[styles.row, index > 0 && styles.border]}><View style={styles.icon}><Ionicons name={row.icon} size={19} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{row.title}</Text><Text style={styles.rowBody}>{row.body}</Text></View><Switch disabled={busy === row.key} value={prefs[row.key] as boolean} onValueChange={(value) => void toggle(row.key, value)} trackColor={{ false: colors.borderStrong, true: colors.accentStrong }} thumbColor={colors.inverse} /></View>)}</GlassCard>
      <GlassCard style={styles.note}><Ionicons name="lock-closed-outline" size={18} color={colors.success} /><Text style={styles.noteText}>These preferences are enforced by the Auronix backend before web or mobile push is sent. In-app operational records can still appear in Notification history even when a push category is disabled.</Text></GlassCard>
    </ScrollView>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }, back: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 2 }, loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }, deviceCard: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11 }, deviceIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, deviceTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, deviceBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, enableButton: { minHeight: 38, paddingHorizontal: 12 }, errorCard: { padding: 13 }, error: { color: colors.danger, fontSize: 10, lineHeight: 15 }, list: { paddingHorizontal: 15 }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 }, border: { borderTopWidth: 1, borderTopColor: colors.border }, icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, rowTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' }, rowBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, note: { padding: 14, flexDirection: 'row', gap: 9 }, noteText: { flex: 1, color: colors.muted, fontSize: 9, lineHeight: 14 },
}); }
