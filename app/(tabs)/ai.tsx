import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AIChat } from '@/components/ai-chat';
import { Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export default function IntelligenceTab() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversationId, setConversationId] = useState<string | undefined>(params.conversationId);

  function newChat() {
    setConversationId(undefined);
    router.setParams({ conversationId: undefined });
  }

  return <Screen>
    <View style={styles.header}><View style={styles.mark}><Ionicons name="sparkles" size={19} color={colors.inverse} /></View><View style={{ flex: 1 }}><Text style={styles.kicker}>ACCOUNT-AWARE</Text><Text style={styles.title}>Auronix Intelligence</Text></View><Pressable accessibilityLabel="Conversation history" onPress={() => router.push('/ai/history')} style={styles.button}><Ionicons name="time-outline" size={20} color={colors.ink} /></Pressable><Pressable accessibilityLabel="New conversation" onPress={newChat} style={styles.button}><Ionicons name="add" size={21} color={colors.ink} /></Pressable></View>
    <AIChat key={conversationId || 'new'} compactHeader initialConversationId={conversationId} onConversationChange={setConversationId} />
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({ header: { minHeight: 66, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: colors.border }, mark: { width: 40, height: 40, borderRadius: 15, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 2 }, button: { width: 39, height: 39, borderRadius: 14, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' } }); }
