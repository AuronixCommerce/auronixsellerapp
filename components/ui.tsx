import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Children, useEffect, useMemo, useRef, type PropsWithChildren, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/theme';
import { shadows } from '@/src/theme';

export function useUIStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create<{
    content: ViewStyle;
    body: TextStyle;
    label: TextStyle;
    input: TextStyle;
    textarea: TextStyle;
    sectionTitle: TextStyle;
    row: ViewStyle;
  }>({
    content: { paddingHorizontal: 18, paddingBottom: 125, gap: 14 },
    body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    label: { color: colors.muted, fontSize: 10, letterSpacing: 1.25, textTransform: 'uppercase', fontWeight: '800' },
    input: {
      minHeight: 54,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.input,
      color: colors.ink,
      paddingHorizontal: 16,
      fontSize: 16,
    },
    textarea: { minHeight: 125, paddingTop: 16, textAlignVertical: 'top' },
    sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.45 },
    row: { flexDirection: 'row', alignItems: 'center' },
  }), [colors]);
}

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useAppTheme();
  return (
    <LinearGradient colors={[...colors.gradient]} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={[styles.orbOne, { backgroundColor: colors.orbOne }]} />
      <View pointerEvents="none" style={[styles.orbTwo, { backgroundColor: colors.orbTwo }]} />
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, style]}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

export function GlassCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors, isDark } = useAppTheme();
  return (
    <BlurView
      intensity={isDark ? 38 : 54}
      tint={colors.glassTint}
      style={[styles.glass, shadows.card, { borderColor: colors.border, backgroundColor: colors.surface }, style]}
    >
      {children}
    </BlurView>
  );
}

export function Header({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function IOSSpinner({ size = 26, color }: { size?: number; color?: string }) {
  const { colors } = useAppTheme();
  const spinnerColor = color || colors.ink;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={{ width: size, height: size, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            width: size * 0.11,
            height: size * 0.30,
            borderRadius: size,
            backgroundColor: spinnerColor,
            opacity: 0.18 + index * 0.065,
            left: size * 0.445,
            top: 0,
            transformOrigin: `50% ${size / 2}px`,
            transform: [{ rotate: `${index * 30}deg` }],
          }}
        />
      ))}
    </Animated.View>
  );
}

export function PrimaryButton({ children, loading, tone = 'accent', ...props }: PressableProps & {
  children: ReactNode;
  loading?: boolean;
  tone?: 'accent' | 'quiet' | 'danger';
}) {
  const { colors } = useAppTheme();
  const backgroundColor = tone === 'accent' ? colors.accentStrong : tone === 'danger' ? colors.dangerSoft : colors.surfaceSoft;
  const textColor = tone === 'accent' ? colors.inverse : tone === 'danger' ? colors.danger : colors.ink;
  const items = Children.toArray(children);
  const textOnly = items.length > 0 && items.every((child) => typeof child === 'string' || typeof child === 'number');
  const content = textOnly
    ? <Text style={[styles.buttonText, { color: textColor }]}>{items.join('')}</Text>
    : items.map((child, index) => (
        typeof child === 'string' || typeof child === 'number'
          ? <Text key={`text-${index}`} style={[styles.buttonText, { color: textColor }]}>{child}</Text>
          : child
      ));

  return (
    <Pressable
      {...props}
      disabled={props.disabled || loading}
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        props.onPress?.(event);
      }}
      style={(state) => [
        styles.button,
        { backgroundColor, borderColor: tone === 'accent' ? colors.accentStrong : colors.border, opacity: props.disabled ? 0.45 : state.pressed ? 0.72 : 1 },
        typeof props.style === 'function' ? props.style(state) : props.style,
      ]}
    >
      {loading ? <IOSSpinner size={20} color={textColor} /> : content}
    </Pressable>
  );
}

export function StatusPill({ value = 'pending' }: { value?: string }) {
  const { colors } = useAppTheme();
  const normalized = value.toLowerCase();
  const tone = ['approved', 'active', 'resolved', 'verified'].some((word) => normalized.includes(word))
    ? colors.success
    : ['rejected', 'suspended', 'closed'].some((word) => normalized.includes(word))
      ? colors.danger
      : colors.warning;

  return (
    <View style={[styles.pill, { backgroundColor: `${tone}18`, borderColor: `${tone}55` }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.pillText, { color: tone }]}>{value}</Text>
    </View>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <GlassCard style={styles.empty}>
      {icon}
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
    </GlassCard>
  );
}

export function ThemeDot({ active }: { active: boolean }) {
  const { colors } = useAppTheme();
  return <View style={[styles.themeDot, { borderColor: active ? colors.accent : colors.borderStrong }, active && { backgroundColor: colors.accent }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  orbOne: { position: 'absolute', width: 280, height: 280, borderRadius: 999, top: -105, right: -105 },
  orbTwo: { position: 'absolute', width: 235, height: 235, borderRadius: 999, bottom: 65, left: -135 },
  glass: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 19, paddingTop: 10, paddingBottom: 18, gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1.05 },
  button: { minHeight: 52, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonText: { fontSize: 15, fontWeight: '800' },
  pill: { alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  pillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.55 },
  dot: { width: 6, height: 6, borderRadius: 6 },
  empty: { padding: 25, alignItems: 'center', gap: 7 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  themeDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
});
