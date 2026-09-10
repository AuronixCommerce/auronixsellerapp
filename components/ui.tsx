import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '@/src/theme';

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <LinearGradient colors={['#07111F', '#050A12', '#02050A']} style={styles.screen}>
      <View pointerEvents="none" style={styles.orbOne} />
      <View pointerEvents="none" style={styles.orbTwo} />
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, style]}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

export function GlassCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <BlurView intensity={38} tint="dark" style={[styles.glass, shadows.card, style]}>{children}</BlurView>;
}

export function Header({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <View style={styles.header}><View style={{ flex: 1 }}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{action}</View>;
}

export function IOSSpinner({ size = 26, color = colors.ink }: { size?: number; color?: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  return <Animated.View accessibilityRole="progressbar" accessibilityLabel="Loading" style={{ width: size, height: size, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
    {Array.from({ length: 12 }).map((_, index) => <View key={index} style={{ position: 'absolute', width: size * .11, height: size * .3, borderRadius: size, backgroundColor: color, opacity: .18 + index * .065, left: size * .445, top: 0, transformOrigin: `50% ${size / 2}px`, transform: [{ rotate: `${index * 30}deg` }] }} />)}
  </Animated.View>;
}

export function PrimaryButton({ children, loading, tone = 'accent', ...props }: PressableProps & { children: ReactNode; loading?: boolean; tone?: 'accent' | 'quiet' | 'danger' }) {
  const backgroundColor = tone === 'accent' ? colors.accentStrong : tone === 'danger' ? 'rgba(255,123,134,.16)' : 'rgba(255,255,255,.08)';
  return <Pressable {...props} disabled={props.disabled || loading} onPress={(event) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); props.onPress?.(event); }} style={(state) => [styles.button, { backgroundColor, opacity: props.disabled ? .45 : state.pressed ? .72 : 1 }, typeof props.style === 'function' ? props.style(state) : props.style]}>{loading ? <IOSSpinner size={20} /> : typeof children === 'string' ? <Text style={styles.buttonText}>{children}</Text> : children}</Pressable>;
}

export function StatusPill({ value = 'pending' }: { value?: string }) {
  const normalized = value.toLowerCase();
  const tone = ['approved', 'active', 'resolved', 'verified'].some((word) => normalized.includes(word)) ? colors.success : ['rejected', 'suspended', 'closed'].some((word) => normalized.includes(word)) ? colors.danger : colors.warning;
  return <View style={[styles.pill, { backgroundColor: `${tone}20`, borderColor: `${tone}55` }]}><View style={[styles.dot, { backgroundColor: tone }]} /><Text style={[styles.pillText, { color: tone }]}>{value}</Text></View>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <GlassCard style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.body}>{body}</Text></GlassCard>;
}

export const ui = StyleSheet.create<{
  content: ViewStyle;
  body: TextStyle;
  label: TextStyle;
  input: TextStyle;
  textarea: TextStyle;
  sectionTitle: TextStyle;
  row: ViewStyle;
}>({
  content: { paddingHorizontal: 18, paddingBottom: 120, gap: 14 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  label: { color: colors.muted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '700' },
  input: { minHeight: 54, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,.055)', color: colors.ink, paddingHorizontal: 16, fontSize: 16 },
  textarea: { minHeight: 125, paddingTop: 16, textAlignVertical: 'top' },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -.4 },
  row: { flexDirection: 'row', alignItems: 'center' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  orbOne: { position: 'absolute', width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(23,136,237,.16)', top: -90, right: -100 },
  orbTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 999, backgroundColor: 'rgba(68,85,180,.10)', bottom: 80, left: -130 },
  glass: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 19, paddingTop: 10, paddingBottom: 18, gap: 12 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 5 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  button: { minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .5 },
  dot: { width: 6, height: 6, borderRadius: 6 },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginBottom: 7 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
