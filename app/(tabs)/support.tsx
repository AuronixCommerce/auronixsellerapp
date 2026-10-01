import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, Header, IOSSpinner, PrimaryButton, Screen, StatusPill, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { supportService } from '@/src/services/support-service';
import type { AppColors } from '@/src/theme';
import type { Ticket } from '@/src/types';

const filters = ['All', 'Open', 'In progress', 'Closed'] as const;

export default function Support() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      setTickets((await supportService.list(force)).data.tickets || []);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load support tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  const shown = useMemo(() => tickets.filter(ticket => {
    const status = String(ticket.status || 'open').toLowerCase();
    const statusOk = filter === 'All' || (filter === 'Open' && status === 'open') || (filter === 'In progress' && status === 'in-progress') || (filter === 'Closed' && ['closed', 'resolved'].includes(status));
    const q = query.trim().toLowerCase();
    const queryOk = !q || `${ticket.subject} ${ticket.category} ${ticket.message} ${ticket.id}`.toLowerCase().includes(q);
    return statusOk && queryOk;
  }), [filter, query, tickets]);

  return (
    <Screen>
      <Header eyebrow="AURONIX SUPPORT" title="Support Center" />
      <View style={styles.search}><Ionicons name="search" size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search tickets" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map(item => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {loading && !tickets.length ? <View style={styles.loader}><IOSSpinner /></View> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} colors={[colors.accent]} />} contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
          <View style={styles.actions}>
            <PrimaryButton style={styles.action} onPress={() => router.push('/support/new-ticket')}>
              <Ionicons name="add-circle-outline" size={22} color={colors.inverse} />
              <Text style={[styles.actionTitle, { color: colors.inverse }]}>Create ticket</Text>
              <Text style={[styles.actionBody, { color: 'rgba(255,255,255,.76)' }]}>Send a tracked request to Auronix Support</Text>
            </PrimaryButton>
            <PrimaryButton tone="quiet" style={styles.action} onPress={() => router.push('/support/chat')}>
              <Ionicons name="sparkles" size={22} color={colors.accent} />
              <Text style={styles.actionTitle}>Ask Intelligence</Text>
              <Text style={styles.actionBody}>Use your seller context for faster guidance</Text>
            </PrimaryButton>
          </View>

          {error ? <GlassCard style={styles.errorCard}><Text style={styles.error}>{error}</Text><PrimaryButton tone="quiet" onPress={() => void load(true)}>Retry</PrimaryButton></GlassCard> : null}
          <View style={styles.sectionHead}><Text style={ui.sectionTitle}>Your tickets</Text><Text style={styles.count}>{shown.length}</Text></View>

          {shown.length ? shown.map(ticket => (
            <Pressable key={ticket.id} onPress={() => router.push({ pathname: '/support/[id]', params: { id: ticket.id } })}>
              <GlassCard style={styles.ticket}>
                <View style={styles.ticketTop}><Text numberOfLines={1} style={styles.ticketTitle}>{ticket.subject}</Text><StatusPill value={ticket.status || 'Open'} /></View>
                <Text numberOfLines={2} style={styles.ticketBody}>{ticket.lastResponse || ticket.message}</Text>
                <View style={styles.ticketMeta}><Text style={styles.metaText}>{ticket.category}</Text><Text style={[styles.metaText, ticket.priority === 'high' || ticket.priority === 'urgent' ? { color: colors.warning } : undefined]}>{ticket.priority || 'normal'} priority</Text><Text style={styles.metaText}>#{ticket.id.slice(-8)}</Text></View>
              </GlassCard>
            </Pressable>
          )) : <GlassCard style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="checkmark-circle-outline" size={34} color={colors.success} /></View><Text style={styles.emptyTitle}>{query || filter !== 'All' ? 'No matching tickets' : 'No support tickets'}</Text><Text style={ui.body}>{query || filter !== 'All' ? 'Change the search or status filter.' : 'Create a support ticket when you need help and track every reply here.'}</Text></GlassCard>}
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    search: { marginHorizontal: 18, minHeight: 48, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13 },
    searchInput: { flex: 1, color: colors.ink, fontSize: 13 },
    filters: { gap: 7, paddingHorizontal: 18, paddingVertical: 10 }, filter: { minHeight: 35, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border }, filterActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, filterText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, filterTextActive: { color: colors.accent },
    actions: { flexDirection: 'row', gap: 10 }, action: { flex: 1, minHeight: 136, alignItems: 'flex-start', gap: 8, padding: 16 }, actionTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 }, actionBody: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'left' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }, count: { color: colors.muted, fontWeight: '700' }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, errorCard: { padding: 15, gap: 12 }, error: { color: colors.danger, fontSize: 11, lineHeight: 17 },
    ticket: { padding: 16 }, ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, ticketTitle: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '900' }, ticketBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 9 }, ticketMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 13 }, metaText: { color: colors.muted, fontSize: 9, textTransform: 'capitalize' },
    empty: { padding: 28, alignItems: 'center', gap: 9 }, emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  });
}
