import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, PrimaryButton, Screen, useUIStyles } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export default function Login() {
  const { login, configured } = useAuth();
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!email.trim() || !password) return setError('Enter your seller email and password.');
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message.replace(/^Firebase:\s*/i, '') : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.mark}><View style={styles.markCore}><Text style={styles.markText}>A</Text></View></View>
          <Text style={styles.kicker}>AURONIX COMMERCE</Text>
          <Text style={styles.title}>Your seller workspace, in your pocket.</Text>
          <Text style={styles.subtitle}>Manage products, catalogs, verification updates, and support from one secure app.</Text>

          <GlassCard style={styles.form}>
            <Text style={ui.label}>Seller email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@company.com"
              placeholderTextColor={colors.muted}
              style={ui.input}
            />
            <Text style={ui.label}>Password</Text>
            <TextInput
              secureTextEntry
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.muted}
              style={ui.input}
            />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {!configured ? <Text style={styles.notice}>Firebase is not configured on this build yet.</Text> : null}
            <PrimaryButton loading={busy} disabled={!configured} onPress={submit}>Sign in securely</PrimaryButton>
          </GlassCard>

          <Link href="/support" style={styles.support}><Ionicons name="headset-outline" size={17} /> Need help accessing your account?</Link>
          <Text style={styles.fine}>Seller access is available only to approved Auronix Commerce accounts.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingVertical: 50 },
    mark: { alignItems: 'center', marginBottom: 18 },
    markCore: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accentStrong, shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    markText: { color: colors.inverse, fontSize: 28, fontWeight: '900' },
    kicker: { color: colors.accent, textAlign: 'center', fontSize: 10, letterSpacing: 2, fontWeight: '900' },
    title: { color: colors.ink, fontSize: 37, lineHeight: 41, letterSpacing: -1.7, fontWeight: '900', textAlign: 'center', marginTop: 10 },
    subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 12, marginBottom: 25 },
    form: { padding: 18, gap: 10 },
    error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
    notice: { color: colors.warning, fontSize: 12, lineHeight: 18 },
    support: { color: colors.accent, textAlign: 'center', marginTop: 24, fontWeight: '700' },
    fine: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 16 },
  });
}
