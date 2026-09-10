import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { sellerApi } from '@/src/lib/api';
import type { AppColors } from '@/src/theme';
import type { Ticket } from '@/src/types';

export default function Support() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setTickets((await sellerApi.workspace()).tickets || []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen>
      <Header eyebrow="AURONIX SUPPORT" title="How can we help?" />
      <ScrollView contentContainerStyle={ui.content}>
        <View style={styles.actions}>
          <PrimaryButton style={styles.action} onPress={() => router.push('/support/chat')}>
            <Ionicons name="sparkles" size={22} color={colors.inverse} />
            <Text style={[styles.actionTitle, { color: colors.inverse }]}>Ask Auronix AI</Text>
            <Text style={[styles.actionBody, { color: 'rgba(255,255,255,.76)' }]}>Typewriter answers with stop and regenerate</Text>
          </PrimaryButton>
          <PrimaryButton tone="quiet" style={styles.action} onPress={() => router.push('/support/new-ticket')}>
            <Ionicons name="ticket-outline" size={22} color={colors.accent} />
            <Text style={styles.actionTitle}>Create ticket</Text>
            <Text style={styles.actionBody}>Send details to the support team</Text>
          </PrimaryButton>
        </View>

        <View style={styles.sectionHead}><Text style={ui.sectionTitle}>Your tickets</Text><Text style={styles.count}>{tickets.length}</Text></View>
        {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load()}>Retry</PrimaryButton></GlassCard> : null}

        {loading ? <View style={styles.loader}><IOSSpinner /></View> : tickets.length ? tickets.map((ticket) => (
          <GlassCard key={ticket.id} style={styles.ticket}>
            <View style={styles.ticketTop}><Text numberOfLines={1} style={styles.ticketTitle}>{ticket.subject}</Text><StatusPill value={ticket.status || 'Open'} /></View>
            <Text style={styles.ticketBody} numberOfLines={2}>{ticket.message}</Text>
            <View style={styles.ticketMeta}><Text style={styles.metaText}>{ticket.category}</Text><Text style={styles.metaText}>#{ticket.id.slice(-8)}</Text></View>
          </GlassCard>
        )) : (
          <GlassCard style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="checkmark-circle-outline" size={34} color={colors.success} /></View><Text style={styles.emptyTitle}>No support tickets</Text><Text style={ui.body}>When you need help, create a ticket here and track it from this screen.</Text></GlassCard>
        )}
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    actions: { flexDirection: 'row', gap: 10 },
    action: { flex: 1, minHeight: 136, alignItems: 'flex-start', gap: 8, padding: 16 },
    actionTitle: { color: colors.ink, fontWeight: '800', fontSize: 15 },
    actionBody: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'left' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    count: { color: colors.muted, fontWeight: '700' },
    loader: { padding: 35, alignItems: 'center' },
    errorCard: { padding: 15, gap: 12 },
    error: { color: colors.danger, fontSize: 12, lineHeight: 18 },
    ticket: { padding: 17 },
    ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ticketTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800' },
    ticketBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
    ticketMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    metaText: { color: colors.muted, fontSize: 10 },
    empty: { padding: 28, alignItems: 'center', gap: 9 },
    emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  });
}
