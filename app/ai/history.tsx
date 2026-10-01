import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, FlatList } from 'react-native';
import { GlassCard, IOSSpinner, Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { aiService } from '@/src/services/ai-service';
import type { AppColors } from '@/src/theme';
import type { AIConversation } from '@/src/types';

export default function AIHistory() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<AIConversation[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await aiService.listConversations()).conversations || []); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load conversation history.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const shown = items.filter(item => `${item.title} ${item.preview || ''}`.toLowerCase().includes(q.toLowerCase()));

  function open(id: string) { router.replace({ pathname: '/(tabs)/ai', params: { conversationId: id } }); }
  function menu(item: AIConversation) {
    Alert.alert(item.title, 'Manage conversation', [
      { text: 'Open', onPress: () => open(item.id) },
      { text: 'Rename', onPress: () => rename(item) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(item) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
  function rename(item: AIConversation) {
    if (typeof Alert.prompt !== 'function') return;
    Alert.prompt('Rename conversation', undefined, async value => {
      const title = value?.trim(); if (!title) return;
      try { await aiService.rename(item.id, title); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to rename conversation.'); }
    }, 'plain-text', item.title);
  }
  function confirmDelete(item: AIConversation) {
    Alert.alert('Delete conversation?', 'This removes this seller AI conversation from your account history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void remove(item.id) }]);
  }
  async function remove(id: string) { try { await aiService.remove(id); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to delete conversation.'); } }

  return <Screen>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.button}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.kicker}>AURONIX INTELLIGENCE</Text><Text style={styles.title}>Conversation history</Text></View><Pressable onPress={() => router.replace('/(tabs)/ai')} style={styles.button}><Ionicons name="add" size={21} color={colors.ink} /></Pressable></View>
    <View style={styles.search}><Ionicons name="search" size={18} color={colors.muted} /><TextInput value={q} onChangeText={setQ} placeholder="Search conversations" placeholderTextColor={colors.muted} style={styles.input} /></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {loading ? <View style={styles.loader}><IOSSpinner /></View> : <FlatList data={shown} keyExtractor={item => item.id} contentContainerStyle={[styles.list, !shown.length && { flexGrow: 1 }]} ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubbles-outline" size={34} color={colors.muted} /><Text style={styles.emptyTitle}>No conversations yet</Text><Text style={styles.emptyBody}>Start a new Auronix Intelligence conversation from the AI tab.</Text></View>} renderItem={({ item }) => <Pressable onPress={() => open(item.id)} onLongPress={() => menu(item)}><GlassCard style={styles.card}><View style={styles.aiIcon}><Ionicons name="sparkles" size={17} color={colors.accent} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.preview}>{item.preview || 'Auronix seller conversation'}</Text><Text style={styles.date}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</Text></View><Pressable hitSlop={10} onPress={() => menu(item)}><Ionicons name="ellipsis-horizontal" size={19} color={colors.muted} /></Pressable></GlassCard></Pressable>} />}
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 13 }, button: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 2 }, search: { marginHorizontal: 18, minHeight: 48, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8 }, input: { flex: 1, color: colors.ink, fontSize: 13 }, error: { color: colors.danger, fontSize: 10, marginHorizontal: 18, marginTop: 8 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, list: { padding: 18, paddingBottom: 40, gap: 9 }, card: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, aiIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, preview: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, date: { color: colors.muted, fontSize: 8, marginTop: 5 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 35 }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 10 }, emptyBody: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 } }); }
