import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, IOSSpinner, PrimaryButton, Screen, StatusPill } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { supportService } from '@/src/services/support-service';
import type { AppColors } from '@/src/theme';
import type { SupportMessage, Ticket } from '@/src/types';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const list = useRef<ScrollView>(null);

  const load = useCallback(async (force = false) => {
    if (!id) return;
    try { setTicket((await supportService.get(String(id), force)).data.ticket); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load this ticket.'); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(false); }, [load]));

  const messages = useMemo(() => {
    if (!ticket) return [] as SupportMessage[];
    const root: SupportMessage[] = ticket.message ? [{ role: 'customer', content: ticket.message, createdAt: ticket.createdAt }] : [];
    return [...root, ...(ticket.messages || [])].sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
  }, [ticket]);

  async function send() {
    const message = reply.trim();
    if (!id || !message) return;
    setBusy(true); setError('');
    try {
      await supportService.reply(String(id), message);
      setReply('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await load(true);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to send reply.'); }
    finally { setBusy(false); }
  }

  async function rate(value: number) {
    if (!id) return;
    try { await supportService.rate(String(id), value); await load(true); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save rating.'); }
  }

  function closeTicket() {
    if (!id) return;
    Alert.alert('Close this support ticket?', 'You can still reopen it by sending a new reply later.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Close ticket', style: 'destructive', onPress: () => void close() }]);
  }
  async function close() {
    setBusy(true);
    try { await supportService.close(String(id)); await load(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to close ticket.'); }
    finally { setBusy(false); }
  }

  return <Screen><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>AURONIX SUPPORT</Text><Text numberOfLines={1} style={styles.title}>{ticket?.subject || 'Support ticket'}</Text></View>{ticket ? <StatusPill value={ticket.status || 'Open'} /> : null}</View>
    {loading && !ticket ? <View style={styles.loader}><IOSSpinner /></View> : ticket ? <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
      <ScrollView ref={list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.summary}><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Reference</Text><Text selectable style={styles.summaryValue}>#{ticket.id.slice(-8)}</Text></View><View style={styles.divider} /><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Category</Text><Text style={styles.summaryValue}>{ticket.category}</Text></View><View style={styles.divider} /><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Priority</Text><Text style={styles.summaryValue}>{ticket.priority || 'normal'}</Text></View>{ticket.assignedAgent ? <><View style={styles.divider} /><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Assigned agent</Text><Text style={styles.summaryValue}>{ticket.assignedAgent}</Text></View></> : null}</GlassCard>
        {messages.map((message, index) => {
          const seller = message.role === 'customer';
          return <View key={`${message.id || index}-${message.createdAt || 0}`} style={[styles.messageWrap, seller && styles.sellerWrap]}><View style={[styles.message, seller ? styles.sellerMessage : styles.agentMessage]}><Text style={[styles.role, seller && { color: 'rgba(255,255,255,.72)' }]}>{seller ? 'YOU' : message.role === 'ai' ? 'AURONIX SUPPORT AI' : 'AURONIX SUPPORT'}</Text><Text selectable style={[styles.messageText, seller && { color: colors.inverse }]}>{message.content}</Text>{message.createdAt ? <Text style={[styles.time, seller && { color: 'rgba(255,255,255,.58)' }]}>{new Date(message.createdAt).toLocaleString()}</Text> : null}</View></View>;
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {['closed', 'resolved'].includes(String(ticket.status || '').toLowerCase()) ? <GlassCard style={styles.rating}><Text style={styles.ratingTitle}>Rate this support experience</Text><View style={styles.stars}>{[1,2,3,4,5].map(value => <Pressable key={value} onPress={() => void rate(value)}><Ionicons name={Number(ticket.rating || 0) >= value ? 'star' : 'star-outline'} size={25} color={colors.warning} /></Pressable>)}</View></GlassCard> : <PrimaryButton tone="danger" loading={busy} onPress={closeTicket}>Close Ticket</PrimaryButton>}
      </ScrollView>
      <View style={styles.composer}><TextInput value={reply} onChangeText={setReply} multiline maxLength={5000} placeholder="Reply to Auronix Support…" placeholderTextColor={colors.muted} style={styles.input} /><Pressable disabled={!reply.trim() || busy} onPress={() => void send()} style={[styles.send, (!reply.trim() || busy) && { opacity: .4 }]}>{busy ? <IOSSpinner size={18} color={colors.inverse} /> : <Ionicons name="arrow-up" size={20} color={colors.inverse} />}</Pressable></View>
    </KeyboardAvoidingView> : <View style={styles.center}><Text style={styles.error}>{error || 'Ticket not found.'}</Text><PrimaryButton tone="quiet" onPress={() => void load(true)}>Retry</PrimaryButton></View>}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 13 }, headerButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 2 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, center: { flex: 1, justifyContent: 'center', padding: 25, gap: 12 }, content: { padding: 15, paddingBottom: 25, gap: 11 }, summary: { paddingHorizontal: 15, marginBottom: 3 }, summaryRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, summaryLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, summaryValue: { color: colors.ink, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' }, divider: { height: 1, backgroundColor: colors.border }, messageWrap: { alignSelf: 'flex-start', maxWidth: '88%' }, sellerWrap: { alignSelf: 'flex-end' }, message: { padding: 14, borderRadius: 20, borderWidth: 1 }, sellerMessage: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong, borderBottomRightRadius: 6 }, agentMessage: { backgroundColor: colors.surface, borderColor: colors.border, borderBottomLeftRadius: 6 }, role: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }, messageText: { color: colors.ink, fontSize: 13, lineHeight: 19 }, time: { color: colors.muted, fontSize: 7, marginTop: 7 }, error: { color: colors.danger, fontSize: 10, lineHeight: 15 }, rating: { padding: 16, alignItems: 'center', gap: 10 }, ratingTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' }, stars: { flexDirection: 'row', gap: 8 }, composer: { margin: 10, marginTop: 0, borderRadius: 23, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.input, flexDirection: 'row', alignItems: 'flex-end', padding: 6, paddingLeft: 13 }, input: { flex: 1, minHeight: 42, maxHeight: 120, color: colors.ink, fontSize: 13, paddingTop: 10, paddingBottom: 9 }, send: { width: 41, height: 41, borderRadius: 15, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' },
}); }
