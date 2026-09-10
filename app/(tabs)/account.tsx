import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, ThemeDot, useUIStyles } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';
import { sellerApi } from '@/src/lib/api';
import type { AppColors, ThemeMode } from '@/src/theme';
import type { SellerProfile } from '@/src/types';

const themeOptions: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function Account() {
  const { user, logout } = useAuth();
  const { colors, mode, setMode } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [form, setForm] = useState({ displayName: '', businessName: '', phone: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const p = (await sellerApi.workspace()).profile;
      setProfile(p);
      setForm({
        displayName: p.displayName || p.name || '',
        businessName: p.businessName || '',
        phone: p.phone || '',
        website: p.website || '',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      await sellerApi.updateProfile(form);
      setMessage('Profile updated.');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  }

  async function exit() {
    await logout();
    router.replace('/login');
  }

  return (
    <Screen>
      <Header eyebrow="SECURE SELLER PROFILE" title="Account" />
      {loading ? (
        <View style={styles.loader}><IOSSpinner /></View>
      ) : (
        <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
          <GlassCard style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(profile?.displayName || profile?.name || user?.email || 'A').slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.displayName || profile?.name || 'Auronix Seller'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <StatusPill value={profile?.status || 'Active'} />
          </GlassCard>

          <View>
            <Text style={[ui.sectionTitle, styles.sectionTitle]}>Appearance</Text>
            <Text style={styles.sectionBody}>Choose how Auronix Seller looks on this device.</Text>
          </View>
          <GlassCard style={styles.themeCard}>
            {themeOptions.map((option, index) => {
              const active = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => void setMode(option.value)}
                  style={({ pressed }) => [styles.themeRow, index > 0 && styles.themeBorder, pressed && { opacity: 0.68 }]}
                >
                  <View style={[styles.themeIcon, active && styles.themeIconActive]}>
                    <Ionicons name={option.icon} size={19} color={active ? colors.accent : colors.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeTitle}>{option.label}</Text>
                    <Text style={styles.themeMeta}>{option.value === 'system' ? 'Follow your phone automatically' : `Always use ${option.value} appearance`}</Text>
                  </View>
                  <ThemeDot active={active} />
                </Pressable>
              );
            })}
          </GlassCard>

          <View>
            <Text style={[ui.sectionTitle, styles.sectionTitle]}>Seller profile</Text>
            <Text style={styles.sectionBody}>Keep the information shown to Auronix support and seller operations current.</Text>
          </View>
          <GlassCard style={styles.form}>
            <Text style={ui.label}>Display name</Text>
            <TextInput style={ui.input} value={form.displayName} onChangeText={(displayName) => setForm({ ...form, displayName })} placeholderTextColor={colors.muted} />
            <Text style={ui.label}>Business name</Text>
            <TextInput style={ui.input} value={form.businessName} onChangeText={(businessName) => setForm({ ...form, businessName })} placeholderTextColor={colors.muted} />
            <Text style={ui.label}>Phone</Text>
            <TextInput keyboardType="phone-pad" style={ui.input} value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} placeholderTextColor={colors.muted} />
            <Text style={ui.label}>Website</Text>
            <TextInput autoCapitalize="none" keyboardType="url" style={ui.input} value={form.website} onChangeText={(website) => setForm({ ...form, website })} placeholder="https://" placeholderTextColor={colors.muted} />
            {message ? <Text style={[styles.message, message === 'Profile updated.' && { color: colors.success }]}>{message}</Text> : null}
            <PrimaryButton loading={busy} onPress={save}>Save profile</PrimaryButton>
          </GlassCard>

          <GlassCard style={styles.security}>
            <View style={styles.securityIcon}><Ionicons name="shield-checkmark-outline" size={21} color={colors.success} /></View>
            <View style={{ flex: 1 }}><Text style={styles.securityTitle}>Secure seller session</Text><Text style={styles.securityBody}>Authentication is handled through your approved seller account.</Text></View>
          </GlassCard>

          <PrimaryButton tone="danger" onPress={exit}>
            <View style={ui.row}><Ionicons name="log-out-outline" color={colors.danger} size={19} /><Text style={styles.logout}>Sign out</Text></View>
          </PrimaryButton>
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    identity: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
    avatar: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.accentStrong, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: colors.inverse, fontWeight: '900', fontSize: 20 },
    name: { color: colors.ink, fontWeight: '900', fontSize: 16 },
    email: { color: colors.muted, fontSize: 11, marginTop: 3 },
    sectionTitle: { marginBottom: 3 },
    sectionBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
    themeCard: { paddingHorizontal: 16 },
    themeRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
    themeBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    themeIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    themeIconActive: { backgroundColor: colors.accentSoft },
    themeTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
    themeMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
    form: { padding: 18, gap: 10 },
    message: { color: colors.danger, fontSize: 12 },
    security: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    securityIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
    securityTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
    securityBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
    logout: { color: colors.danger, fontWeight: '800', marginLeft: 8 },
  });
}
