import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, Header, Screen, useUIStyles } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

const groups = [
  { title: 'Operate', items: [
    ['Analytics', 'analytics-outline', '/analytics'], ['Suppliers', 'business-outline', '/suppliers'], ['Documents', 'folder-open-outline', '/documents'], ['Marketplaces', 'storefront-outline', '/marketplaces'], ['Sync Queue', 'sync-outline', '/sync-queue'],
  ]},
  { title: 'Account', items: [
    ['Support', 'headset-outline', '/(tabs)/support'], ['Notifications', 'notifications-outline', '/(tabs)/notifications'], ['Notification Settings', 'options-outline', '/notification-settings'], ['Security', 'shield-checkmark-outline', '/security'], ['Application', 'document-text-outline', '/application'], ['Settings', 'settings-outline', '/(tabs)/account'],
  ]},
] as const;

export default function More() {
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Screen><Header eyebrow="SELLER OPERATING SYSTEM" title="More" /><ScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
    {groups.map(group => <View key={group.title} style={{ gap: 8 }}><Text style={ui.sectionTitle}>{group.title}</Text><GlassCard>{group.items.map(([label, icon, href], index) => <Pressable key={label} onPress={() => router.push(href as any)} style={[styles.row, index > 0 && styles.border]}><View style={styles.icon}><Ionicons name={icon} size={20} color={colors.accent} /></View><Text style={styles.label}>{label}</Text><Ionicons name="chevron-forward" size={17} color={colors.muted} /></Pressable>)}</GlassCard></View>)}
    <GlassCard style={styles.note}><Ionicons name="shield-checkmark-outline" size={21} color={colors.success} /><View style={{ flex: 1 }}><Text style={styles.noteTitle}>Auronix Seller</Text><Text style={styles.noteBody}>Connected modules only show real seller data. Unconfigured integrations remain clearly disconnected.</Text></View></GlassCard>
  </ScrollView></Screen>;
}
function createStyles(colors: AppColors) { return StyleSheet.create({ row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15 }, border: { borderTopWidth: 1, borderTopColor: colors.border }, icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, label: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '800' }, note: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }, noteTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, noteBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 } }); }
