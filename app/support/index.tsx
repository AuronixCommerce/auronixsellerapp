import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, PrimaryButton, Screen, ui } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { colors } from '@/src/theme';

export default function PublicSupport() {
  const { user } = useAuth();
  return <Screen><Header eyebrow="AURONIX COMMERCE" title="Support center" action={<PrimaryButton tone="quiet" style={styles.close} onPress={() => router.back()}><Ionicons name="close" size={22} color={colors.ink} /></PrimaryButton>} /><ScrollView contentContainerStyle={ui.content}>
    <GlassCard style={styles.hero}><Ionicons name="headset-outline" size={32} color={colors.accent} /><Text style={styles.heroTitle}>Help when you need it.</Text><Text style={ui.body}>Ask Auronix AI for immediate guidance or create a tracked request for the support team.</Text></GlassCard>
    <PrimaryButton style={styles.option} onPress={() => router.push('/support/chat')}><Ionicons name="sparkles" size={22} color="#fff" /><View style={{ flex: 1 }}><Text style={styles.optionTitle}>Chat with Auronix AI</Text><Text style={styles.optionBody}>Seller access, applications, policies and troubleshooting</Text></View><Ionicons name="chevron-forward" size={18} color="#fff" /></PrimaryButton>
    <PrimaryButton tone="quiet" style={styles.option} onPress={() => router.push('/support/new-ticket')}><Ionicons name="ticket-outline" size={22} color={colors.accent} /><View style={{ flex: 1 }}><Text style={styles.optionTitle}>Create a support ticket</Text><Text style={styles.optionBody}>{user ? 'Linked automatically to your seller account' : 'Receive a reference for follow-up'}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></PrimaryButton>
    <Text style={styles.safe}>Never send passwords, verification codes, payment details, or private access links through support.</Text>
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({ close: { width: 42, minHeight: 42, paddingHorizontal: 0 }, hero: { padding: 26, alignItems: 'center', gap: 12 }, heroTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -.7 }, option: { minHeight: 82, flexDirection: 'row', justifyContent: 'flex-start', gap: 13, paddingHorizontal: 17 }, optionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'left' }, optionBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: 'left' }, safe: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, paddingHorizontal: 15 } });
