import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IOSSpinner, Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { askAuronix } from '@/src/lib/api';
import type { AppColors } from '@/src/theme';

type Message = { role: 'user' | 'assistant'; content: string };

const welcome: Message = {
  role: 'assistant',
  content: 'Hi, I’m Auronix AI. I can help with seller access, applications, products, verification, policies, and support. What do you need help with?',
};

const prompts = [
  'Check my seller status',
  'Help with verification',
  'Explain catalog requirements',
  'Create a support ticket',
];

export default function Chat() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const list = useRef<ScrollView>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    controller.current?.abort();
    if (timer.current) clearInterval(timer.current);
  }, []);

  function scrollToBottom() {
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 30);
  }

  function stopGeneration() {
    controller.current?.abort();
    controller.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setBusy(false);
    setTyping(false);
    Haptics.selectionAsync().catch(() => {});
  }

  function typeResponse(base: Message[], response: string) {
    if (timer.current) clearInterval(timer.current);
    const full = response.trim() || 'I could not answer that right now.';
    let index = 0;
    const initial = [...base, { role: 'assistant' as const, content: '' }];
    setMessages(initial);
    setTyping(true);
    scrollToBottom();

    timer.current = setInterval(() => {
      index = Math.min(full.length, index + Math.max(1, Math.ceil(full.length / 220)));
      setMessages((current) => {
        if (!current.length) return current;
        const next = [...current];
        next[next.length - 1] = { role: 'assistant', content: full.slice(0, index) };
        return next;
      });
      if (index >= full.length) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setTyping(false);
      }
    }, 14);
  }

  async function runConversation(base: Message[]) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    try {
      const result = await askAuronix(base.slice(-16), { signal: request.signal });
      if (request.signal.aborted) return;
      setBusy(false);
      controller.current = null;
      typeResponse(base, result.response || result.error || 'I could not answer that right now.');
    } catch (error) {
      if (request.signal.aborted) return;
      setBusy(false);
      controller.current = null;
      typeResponse(base, error instanceof Error ? error.message : 'Auronix AI is temporarily unavailable.');
    }
  }

  async function send(value = input) {
    const text = value.trim();
    if (!text || busy || typing) return;
    if (/create.{0,20}(ticket|support request)/i.test(text)) {
      router.push('/support/new-ticket');
      return;
    }
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    scrollToBottom();
    await runConversation(next);
  }

  async function regenerate() {
    if (busy || typing) return;
    const lastAssistant = messages.at(-1)?.role === 'assistant' && messages.length > 1;
    const base = lastAssistant ? messages.slice(0, -1) : messages;
    if (!base.some((message) => message.role === 'user')) return;
    setMessages(base);
    await runConversation(base);
  }

  function clearChat() {
    stopGeneration();
    setMessages([welcome]);
    setInput('');
  }

  const canRegenerate = messages.length > 2 && messages.at(-1)?.role === 'assistant' && !busy && !typing;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <View style={styles.aiMark}><Ionicons name="sparkles" size={18} color={colors.inverse} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Auronix AI</Text>
          <View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.headerMeta}>{busy ? 'Thinking' : typing ? 'Responding' : 'Online'}</Text></View>
        </View>
        <Pressable onPress={clearChat} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={19} color={colors.muted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8} style={{ flex: 1 }}>
        <ScrollView
          ref={list}
          onContentSizeChange={scrollToBottom}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => (
            <View key={`${message.role}-${index}`} style={[styles.message, message.role === 'user' ? styles.userMessage : styles.aiMessage]}>
              <View style={styles.roleRow}>
                {message.role === 'assistant' ? <Ionicons name="sparkles" size={11} color={colors.accent} /> : null}
                <Text style={[styles.role, message.role === 'user' && styles.userRole]}>{message.role === 'user' ? 'YOU' : 'AURONIX AI'}</Text>
              </View>
              <Text selectable style={[styles.messageText, message.role === 'user' && { color: colors.inverse }]}>{message.content}{typing && index === messages.length - 1 ? '▍' : ''}</Text>
            </View>
          ))}

          {busy ? (
            <View style={[styles.message, styles.aiMessage, styles.thinkingCard]}>
              <IOSSpinner size={19} color={colors.accent} />
              <View><Text style={styles.thinkingTitle}>Auronix AI is thinking</Text><Text style={styles.thinkingMeta}>Reviewing your request…</Text></View>
            </View>
          ) : null}

          {canRegenerate ? (
            <Pressable onPress={regenerate} style={styles.regenerate}>
              <Ionicons name="refresh-outline" size={15} color={colors.muted} />
              <Text style={styles.regenerateText}>Regenerate response</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {messages.length === 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts}>
            {prompts.map((prompt) => (
              <Pressable key={prompt} onPress={() => void send(prompt)} style={styles.prompt}>
                <Text style={styles.promptText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              multiline
              maxLength={4000}
              value={input}
              onChangeText={setInput}
              placeholder="Message Auronix AI…"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            {busy || typing ? (
              <Pressable accessibilityLabel="Stop response" onPress={stopGeneration} style={styles.stop}>
                <View style={styles.stopSquare} />
              </Pressable>
            ) : (
              <Pressable disabled={!input.trim()} onPress={() => void send()} style={[styles.send, !input.trim() && { opacity: 0.38 }]}>
                <Ionicons name="arrow-up" color={colors.inverse} size={21} />
              </Pressable>
            )}
          </View>
        </View>
        <Text style={styles.disclosure}>AI can make mistakes. Confirm important seller-account information in your workspace.</Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
    aiMark: { width: 41, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentStrong },
    headerTitle: { color: colors.ink, fontWeight: '900', fontSize: 15 },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    onlineDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: colors.success },
    headerMeta: { color: colors.success, fontSize: 10, fontWeight: '700' },
    messages: { padding: 15, gap: 12, paddingBottom: 24 },
    message: { maxWidth: '90%', borderRadius: 22, padding: 15, borderWidth: 1 },
    aiMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderBottomLeftRadius: 7 },
    userMessage: { alignSelf: 'flex-end', backgroundColor: colors.accentStrong, borderColor: colors.accentStrong, borderBottomRightRadius: 7 },
    roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
    role: { color: colors.accent, fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
    userRole: { color: 'rgba(255,255,255,.70)' },
    messageText: { color: colors.ink, fontSize: 14, lineHeight: 21 },
    thinkingCard: { flexDirection: 'row', alignItems: 'center', gap: 11, minWidth: 205 },
    thinkingTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    thinkingMeta: { color: colors.muted, fontSize: 10, marginTop: 2 },
    regenerate: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 34, borderRadius: 999, backgroundColor: colors.surfaceSoft },
    regenerateText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    prompts: { gap: 8, paddingHorizontal: 14, paddingBottom: 9 },
    prompt: { paddingHorizontal: 14, minHeight: 39, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.surfaceSoft },
    promptText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    composerWrap: { paddingHorizontal: 11, paddingTop: 4 },
    composer: { borderRadius: 24, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'flex-end', padding: 6, paddingLeft: 15 },
    input: { flex: 1, minHeight: 44, maxHeight: 120, color: colors.ink, fontSize: 15, paddingTop: 11, paddingBottom: 10 },
    send: { width: 43, height: 43, borderRadius: 16, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' },
    stop: { width: 43, height: 43, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
    stopSquare: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.background },
    disclosure: { color: colors.muted, textAlign: 'center', fontSize: 9, paddingVertical: 8, paddingHorizontal: 18 },
  });
}
