import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, ui } from '@/components/ui';
import { sellerApi } from '@/src/lib/api';
import { colors } from '@/src/theme';
import type { Ticket } from '@/src/types';

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setTickets((await sellerApi.workspace()).tickets || []); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <Screen><Header eyebrow="AURONIX SUPPORT" title="How can we help?" /><ScrollView contentContainerStyle={ui.content}>
    <View style={styles.actions}><PrimaryButton style={styles.action} onPress={() => router.push('/support/chat')}><Ionicons name="sparkles" size={22} color="#fff" /><Text style={styles.actionTitle}>Ask Auronix AI</Text><Text style={styles.actionBody}>Fast guidance for your next step</Text></PrimaryButton><PrimaryButton tone="quiet" style={styles.action} onPress={() => router.push('/support/new-ticket')}><Ionicons name="ticket-outline" size={22} color={colors.accent} /><Text style={styles.actionTitle}>Create ticket</Text><Text style={styles.actionBody}>Send details to the support team</Text></PrimaryButton></View>
    <View style={styles.sectionHead}><Text style={ui.sectionTitle}>Your tickets</Text><Text style={styles.count}>{tickets.length}</Text></View>
    {loading ? <View style={styles.loader}><IOSSpinner /></View> : tickets.length ? tickets.map((ticket) => <GlassCard key={ticket.id} style={styles.ticket}><View style={styles.ticketTop}><Text numberOfLines={1} style={styles.ticketTitle}>{ticket.subject}</Text><StatusPill value={ticket.status || 'Open'} /></View><Text style={styles.ticketBody} numberOfLines={2}>{ticket.message}</Text><View style={styles.ticketMeta}><Text>{ticket.category}</Text><Text>#{ticket.id.slice(-8)}</Text></View></GlassCard>) : <GlassCard style={styles.empty}><Ionicons name="checkmark-circle-outline" size={38} color={colors.success} /><Text style={styles.emptyTitle}>No support tickets</Text><Text style={ui.body}>When you need help, create a ticket here and track it from this screen.</Text></GlassCard>}
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 10 }, action: { flex: 1, minHeight: 132, alignItems: 'flex-start', gap: 8, padding: 16 }, actionTitle: { color: colors.ink, fontWeight: '800', fontSize: 15 }, actionBody: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'left' }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, count: { color: colors.muted }, loader: { padding: 35, alignItems: 'center' }, ticket: { padding: 17 }, ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, ticketTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700' }, ticketBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 }, ticketMeta: { color: colors.muted, flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }, empty: { padding: 28, alignItems: 'center', gap: 9 }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' } });
