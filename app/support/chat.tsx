import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AIChat } from '@/components/ai-chat';
import { Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Screen>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.button}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View style={styles.mark}><Ionicons name="sparkles" size={18} color={colors.inverse} /></View><View style={{ flex: 1 }}><Text style={styles.title}>Auronix Intelligence</Text><Text style={styles.meta}>Authenticated seller context</Text></View><Pressable onPress={() => router.push('/ai/history')} style={styles.button}><Ionicons name="time-outline" size={19} color={colors.ink} /></Pressable></View>
    <AIChat compactHeader initialConversationId={id} />
  </Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({ header: { minHeight: 67, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: colors.border }, button: { width: 41, height: 41, borderRadius: 15, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, mark: { width: 40, height: 40, borderRadius: 15, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.ink, fontWeight: '900', fontSize: 14 }, meta: { color: colors.muted, fontSize: 9, marginTop: 2 } }); }
