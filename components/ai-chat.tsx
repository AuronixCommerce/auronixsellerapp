import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { IOSSpinner } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { aiService } from '@/src/services/ai-service';
import type { AppColors } from '@/src/theme';
import type { AIMessage } from '@/src/types';

const welcome: AIMessage = { role: 'assistant', content: 'I’m Auronix Intelligence. I can use your authorized seller account context to help with products, catalogs, verification, support and operational decisions.' };
const suggestions = ['Summarize my account', 'Which products need attention?', 'How much inventory do I have?', 'Which catalogs need review?'];

export function AIChat({ initialConversationId, onConversationChange, compactHeader = false }: { initialConversationId?: string; onConversationChange?: (id?: string) => void; compactHeader?: boolean }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [messages, setMessages] = useState<AIMessage[]>([welcome]);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(initialConversationId));
  const [error, setError] = useState('');
  const list = useRef<ScrollView>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!initialConversationId) { setLoadingHistory(false); return; }
    aiService.conversation(initialConversationId).then(result => {
      if (!mounted) return;
      setConversationId(initialConversationId);
      setMessages(result.conversation.messages?.length ? result.conversation.messages : [welcome]);
      setError('');
    }).catch(caught => mounted && setError(caught instanceof Error ? caught.message : 'Unable to load this conversation.')).finally(() => mounted && setLoadingHistory(false));
    return () => { mounted = false; };
  }, [initialConversationId]);

  useEffect(() => () => { controller.current?.abort(); if (timer.current) clearInterval(timer.current); }, []);

  function scroll() { setTimeout(() => list.current?.scrollToEnd({ animated: true }), 30); }
  function stop() {
    controller.current?.abort(); controller.current = null;
    if (timer.current) clearInterval(timer.current); timer.current = null;
    setBusy(false); setTyping(false);
    void Haptics.selectionAsync().catch(() => undefined);
  }
  function typeResponse(base: AIMessage[], response: string) {
    const full = response.trim() || 'I could not answer that right now.';
    let index = 0;
    setMessages([...base, { role: 'assistant', content: '' }]); setTyping(true); scroll();
    timer.current = setInterval(() => {
      index = Math.min(full.length, index + Math.max(1, Math.ceil(full.length / 220)));
      setMessages(current => { const next = [...current]; next[next.length - 1] = { role: 'assistant', content: full.slice(0, index) }; return next; });
      if (index >= full.length) { if (timer.current) clearInterval(timer.current); timer.current = null; setTyping(false); }
    }, 14);
  }
  async function run(base: AIMessage[]) {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request; setBusy(true); setError('');
    try {
      const result = await aiService.ask(base.slice(-20), conversationId, request.signal);
      if (request.signal.aborted) return;
      setConversationId(result.conversationId); onConversationChange?.(result.conversationId); setBusy(false); controller.current = null;
      typeResponse(base, result.response);
    } catch (caught) {
      if (request.signal.aborted) return;
      setBusy(false); controller.current = null; setError(caught instanceof Error ? caught.message : 'Auronix Intelligence is temporarily unavailable.');
    }
  }
  async function send(value = input) {
    const text = value.trim(); if (!text || busy || typing) return;
    const base = messages.length === 1 && messages[0] === welcome ? [] : messages;
    const next: AIMessage[] = [...base, { role: 'user', content: text, createdAt: Date.now() }];
    setMessages(next); setInput(''); scroll(); await run(next);
  }
  async function regenerate() {
    if (busy || typing) return;
    const base = messages.at(-1)?.role === 'assistant' ? messages.slice(0, -1) : messages;
    if (!base.some(item => item.role === 'user')) return;
    setMessages(base); await run(base);
  }
  function newConversation() { stop(); setConversationId(undefined); onConversationChange?.(undefined); setMessages([welcome]); setInput(''); setError(''); }
  async function copy(text: string) { await Clipboard.setStringAsync(text); await Haptics.selectionAsync().catch(() => undefined); }
  async function share(text: string) { await Share.share({ message: text, title: 'Auronix Intelligence' }); }

  if (loadingHistory) return <View style={styles.loader}><IOSSpinner /></View>;
  const canRegenerate = messages.length > 1 && messages.at(-1)?.role === 'assistant' && !busy && !typing;

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={compactHeader ? 6 : 10}>
    {!compactHeader ? <View style={styles.header}><View style={styles.aiMark}><Ionicons name="sparkles" size={18} color={colors.inverse} /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>Auronix Intelligence</Text><Text style={styles.headerMeta}>{busy ? 'Analyzing seller context…' : typing ? 'Responding…' : 'Account-aware assistant'}</Text></View><Pressable onPress={newConversation} style={styles.headerButton}><Ionicons name="add" size={20} color={colors.ink} /></Pressable></View> : null}
    <ScrollView ref={list} onContentSizeChange={scroll} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {messages.map((message, index) => <View key={`${message.role}-${index}`} style={[styles.messageWrap, message.role === 'user' && styles.userWrap]}><View style={[styles.message, message.role === 'user' ? styles.userMessage : styles.aiMessage]}><View style={styles.roleRow}>{message.role === 'assistant' ? <Ionicons name="sparkles" size={11} color={colors.accent} /> : null}<Text style={[styles.role, message.role === 'user' && { color: 'rgba(255,255,255,.7)' }]}>{message.role === 'user' ? 'YOU' : 'AURONIX INTELLIGENCE'}</Text></View><Text selectable style={[styles.messageText, message.role === 'user' && { color: colors.inverse }]}>{message.content}{typing && index === messages.length - 1 ? '▍' : ''}</Text></View>{message.role === 'assistant' && message.content && index > 0 ? <View style={styles.messageActions}><Pressable accessibilityLabel="Copy response" onPress={() => void copy(message.content)} style={styles.smallAction}><Ionicons name="copy-outline" size={14} color={colors.muted} /></Pressable><Pressable accessibilityLabel="Share response" onPress={() => void share(message.content)} style={styles.smallAction}><Ionicons name="share-outline" size={14} color={colors.muted} /></Pressable></View> : null}</View>)}
      {busy ? <View style={[styles.message, styles.aiMessage, styles.thinking]}><IOSSpinner size={18} color={colors.accent} /><View><Text style={styles.thinkingTitle}>Reviewing your account</Text><Text style={styles.thinkingMeta}>Products, catalogs, tickets and available seller data</Text></View></View> : null}
      {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={17} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}
      {canRegenerate ? <Pressable onPress={() => void regenerate()} style={styles.regenerate}><Ionicons name="refresh-outline" size={14} color={colors.muted} /><Text style={styles.regenerateText}>Regenerate</Text></Pressable> : null}
    </ScrollView>
    {messages.length <= 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>{suggestions.map(item => <Pressable key={item} onPress={() => void send(item)} style={styles.suggestion}><Text style={styles.suggestionText}>{item}</Text></Pressable>)}</ScrollView> : null}
    <View style={styles.composerWrap}><View style={styles.composer}><TextInput value={input} onChangeText={setInput} multiline maxLength={4000} placeholder="Ask about your seller account…" placeholderTextColor={colors.muted} style={styles.input} />{busy || typing ? <Pressable onPress={stop} accessibilityLabel="Stop response" style={styles.stop}><View style={styles.stopSquare} /></Pressable> : <Pressable disabled={!input.trim()} onPress={() => void send()} style={[styles.send, !input.trim() && { opacity: .36 }]}><Ionicons name="arrow-up" size={20} color={colors.inverse} /></Pressable>}</View></View>
    <Text style={styles.disclosure}>Account context is isolated to your authenticated seller. AI can make mistakes; verify important decisions.</Text>
  </KeyboardAvoidingView>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: colors.border }, aiMark: { width: 41, height: 41, borderRadius: 15, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' }, headerMeta: { color: colors.muted, fontSize: 9, marginTop: 2 }, headerButton: { width: 41, height: 41, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 14, paddingBottom: 24, gap: 11 }, messageWrap: { alignSelf: 'flex-start', maxWidth: '91%' }, userWrap: { alignSelf: 'flex-end' }, message: { borderRadius: 22, padding: 15, borderWidth: 1 }, aiMessage: { backgroundColor: colors.surface, borderColor: colors.border, borderBottomLeftRadius: 7 }, userMessage: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong, borderBottomRightRadius: 7 }, roleRow: { flexDirection: 'row', gap: 5, alignItems: 'center', marginBottom: 7 }, role: { color: colors.accent, fontSize: 8, letterSpacing: 1, fontWeight: '900' }, messageText: { color: colors.ink, fontSize: 14, lineHeight: 21 }, messageActions: { flexDirection: 'row', gap: 4, marginTop: 4 }, smallAction: { width: 31, height: 29, borderRadius: 10, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 230 }, thinkingTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' }, thinkingMeta: { color: colors.muted, fontSize: 8, marginTop: 2 }, error: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: colors.dangerSoft, padding: 11, borderRadius: 14 }, errorText: { color: colors.danger, fontSize: 10, flex: 1 }, regenerate: { alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, minHeight: 33, borderRadius: 999, backgroundColor: colors.surfaceSoft }, regenerateText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  suggestions: { gap: 7, paddingHorizontal: 12, paddingBottom: 8 }, suggestion: { paddingHorizontal: 12, minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }, suggestionText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  composerWrap: { paddingHorizontal: 10, paddingTop: 4 }, composer: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.input, padding: 6, paddingLeft: 14 }, input: { flex: 1, minHeight: 43, maxHeight: 120, color: colors.ink, fontSize: 14, paddingTop: 11, paddingBottom: 10 }, send: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' }, stop: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, stopSquare: { width: 11, height: 11, borderRadius: 3, backgroundColor: colors.background }, disclosure: { color: colors.muted, fontSize: 8, lineHeight: 12, textAlign: 'center', paddingHorizontal: 20, paddingVertical: 7 },
}); }
