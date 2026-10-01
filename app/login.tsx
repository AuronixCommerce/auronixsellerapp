import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const markScale = useRef(new Animated.Value(0.86)).current;
  const markY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.spring(markScale, { toValue: 1, damping: 12, stiffness: 145, mass: 0.8, useNativeDriver: true }).start();
    Animated.spring(markY, { toValue: 0, damping: 15, stiffness: 150, useNativeDriver: true }).start();
  }, [markScale, markY]);

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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mark, { transform: [{ scale: markScale }, { translateY: markY }] }]}>
            <View style={styles.markGlow} />
            <View style={styles.markCore}><Text style={styles.markText}>A</Text></View>
          </Animated.View>
          <Text style={styles.kicker}>AURONIX COMMERCE</Text>
          <Text style={styles.title}>Seller operations, beautifully connected.</Text>
          <Text style={styles.subtitle}>Products, catalogs, verification updates, support, and Auronix Intelligence in one secure workspace.</Text>

          <GlassCard style={styles.form}>
            <View style={styles.formHead}>
              <View style={styles.lockIcon}><Ionicons name="lock-closed" size={17} color={colors.accent} /></View>
              <View style={{ flex: 1 }}><Text style={styles.formTitle}>Secure seller sign in</Text><Text style={styles.formMeta}>Protected Firebase session</Text></View>
            </View>

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
            <View style={[styles.passwordShell, { borderColor: colors.border, backgroundColor: colors.input }]}>
              <TextInput
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={colors.muted}
                style={[ui.input, styles.passwordInput]}
                onSubmitEditing={() => void submit()}
                returnKeyType="go"
              />
              <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={10} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </Pressable>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {!configured ? <Text style={styles.notice}>Firebase is not configured on this build yet.</Text> : null}
            <PrimaryButton loading={busy} disabled={!configured} onPress={() => void submit()}>
              <Ionicons name="arrow-forward" size={18} color={colors.inverse} />
              <Text style={styles.signInText}>Sign in securely</Text>
            </PrimaryButton>
          </GlassCard>

          <Link href="/support" style={styles.support}>Need help accessing your seller account?</Link>
          <View style={styles.trustRow}><Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} /><Text style={styles.fine}>Approved Auronix Commerce seller accounts only</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingVertical: 44 },
    mark: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    markGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accentSoft, transform: [{ scale: 1.2 }] },
    markCore: { width: 66, height: 66, borderRadius: 23, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', shadowColor: colors.accentStrong, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 9 }, elevation: 9 },
    markText: { color: colors.inverse, fontSize: 30, fontWeight: '900' },
    kicker: { color: colors.accent, textAlign: 'center', fontSize: 10, letterSpacing: 2.1, fontWeight: '900' },
    title: { color: colors.ink, fontSize: 36, lineHeight: 40, letterSpacing: -1.65, fontWeight: '900', textAlign: 'center', marginTop: 10 },
    subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 20, fontSize: 13, marginTop: 12, marginBottom: 24, paddingHorizontal: 4 },
    form: { padding: 18, gap: 10 },
    formHead: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 5 },
    lockIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
    formTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
    formMeta: { color: colors.muted, fontSize: 10, marginTop: 2 },
    passwordShell: { minHeight: 54, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
    passwordInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingRight: 4 },
    eyeButton: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
    error: { color: colors.danger, fontSize: 12, lineHeight: 18, paddingHorizontal: 2 },
    notice: { color: colors.warning, fontSize: 12, lineHeight: 18 },
    signInText: { color: colors.inverse, fontWeight: '800', fontSize: 14 },
    support: { color: colors.accent, textAlign: 'center', marginTop: 22, fontWeight: '700', fontSize: 12 },
    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15 },
    fine: { color: colors.muted, fontSize: 10 },
  });
}
