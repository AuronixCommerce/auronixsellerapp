import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard, PrimaryButton } from '@/components/ui';
import { useAppLock } from '@/src/context/app-lock';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export function AppLockScreen() {
  const { colors } = useAppTheme();
  const { biometricName, unlock } = useAppLock();
  const { logout } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleUnlock() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    const success = await unlock();
    if (!success) setMessage('Authentication was not completed. Try again when you’re ready.');
    setBusy(false);
  }

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...colors.gradient]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.orbOne, { backgroundColor: colors.orbOne }]} />
      <View pointerEvents="none" style={[styles.orbTwo, { backgroundColor: colors.orbTwo }]} />
      <View style={styles.content}>
        <View style={styles.lockMark}>
          <View style={styles.lockGlow} />
          <View style={styles.lockCore}><Ionicons name="lock-closed" size={29} color={colors.inverse} /></View>
        </View>
        <Text style={styles.eyebrow}>AURONIX SECURE SESSION</Text>
        <Text style={styles.title}>Seller workspace locked</Text>
        <Text style={styles.body}>Use {biometricName} or your device authentication to continue.</Text>

        <GlassCard style={styles.card}>
          <View style={styles.securityRow}>
            <View style={styles.securityIcon}><Ionicons name="shield-checkmark-outline" size={20} color={colors.success} /></View>
            <View style={{ flex: 1 }}><Text style={styles.securityTitle}>Protected locally</Text><Text style={styles.securityMeta}>Your Firebase session remains signed in while the app stays locked.</Text></View>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <PrimaryButton loading={busy} onPress={() => void handleUnlock()}>
            <Ionicons name="scan-outline" size={19} color={colors.inverse} />
            <Text style={styles.unlockText}>Unlock with {biometricName}</Text>
          </PrimaryButton>
          <PrimaryButton tone="quiet" onPress={() => void signOut()}>Sign out instead</PrimaryButton>
        </GlassCard>
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject, zIndex: 10000, alignItems: 'center', justifyContent: 'center', padding: 22, overflow: 'hidden' },
    orbOne: { position: 'absolute', width: 330, height: 330, borderRadius: 999, top: -120, right: -140 },
    orbTwo: { position: 'absolute', width: 270, height: 270, borderRadius: 999, bottom: -80, left: -130 },
    content: { width: '100%', maxWidth: 430, alignItems: 'center' },
    lockMark: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    lockGlow: { position: 'absolute', width: 82, height: 82, borderRadius: 28, backgroundColor: colors.accentSoft, transform: [{ scale: 1.28 }] },
    lockCore: { width: 66, height: 66, borderRadius: 23, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
    eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
    title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: 9, textAlign: 'center' },
    body: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 9, marginBottom: 22, maxWidth: 310 },
    card: { alignSelf: 'stretch', padding: 18, gap: 13 },
    securityRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    securityIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
    securityTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
    securityMeta: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
    message: { color: colors.danger, fontSize: 11, lineHeight: 16 },
    unlockText: { color: colors.inverse, fontSize: 13, fontWeight: '800' },
  });
}
