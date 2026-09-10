import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, PrimaryButton, Screen, useUIStyles } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export default function PublicSupport() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen>
      <Header eyebrow="AURONIX COMMERCE" title="Support center" action={<PrimaryButton tone="quiet" style={styles.close} onPress={() => router.back()}><Ionicons name="close" size={22} color={colors.ink} /></PrimaryButton>} />
      <ScrollView contentContainerStyle={ui.content}>
        <GlassCard style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="headset-outline" size={31} color={colors.accent} /></View>
          <Text style={styles.heroTitle}>Help when you need it.</Text>
          <Text style={ui.body}>Ask Auronix AI for immediate guidance or create a tracked request for the support team.</Text>
        </GlassCard>

        <PrimaryButton style={styles.option} onPress={() => router.push('/support/chat')}>
          <Ionicons name="sparkles" size={22} color={colors.inverse} />
          <View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.inverse }]}>Chat with Auronix AI</Text><Text style={[styles.optionBody, { color: 'rgba(255,255,255,.76)' }]}>Seller access, applications, policies and troubleshooting</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.inverse} />
        </PrimaryButton>

        <PrimaryButton tone="quiet" style={styles.option} onPress={() => router.push('/support/new-ticket')}>
          <Ionicons name="ticket-outline" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}><Text style={styles.optionTitle}>Create a support ticket</Text><Text style={styles.optionBody}>{user ? 'Linked automatically to your seller account' : 'Receive a reference for follow-up'}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </PrimaryButton>

        <GlassCard style={styles.safety}><Ionicons name="lock-closed-outline" size={18} color={colors.success} /><Text style={styles.safe}>Never send passwords, verification codes, payment details, or private access links through support.</Text></GlassCard>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    close: { width: 42, minHeight: 42, paddingHorizontal: 0 },
    hero: { padding: 26, alignItems: 'center', gap: 12 },
    heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
    option: { minHeight: 84, flexDirection: 'row', justifyContent: 'flex-start', gap: 13, paddingHorizontal: 17 },
    optionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'left' },
    optionBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: 'left' },
    safety: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    safe: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 17 },
  });
}
