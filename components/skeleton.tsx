import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/context/theme';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.42)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.55);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.85, duration: 850, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.42, duration: 850, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.base, { backgroundColor: colors.surfaceSoft, opacity }, style]} />;
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboard}>
      <Skeleton style={{ height: 152, borderRadius: 26 }} />
      <View style={styles.row}>{[0, 1, 2].map(item => <Skeleton key={item} style={{ flex: 1, height: 108, borderRadius: 22 }} />)}</View>
      <Skeleton style={{ height: 112, borderRadius: 26 }} />
      <Skeleton style={{ height: 190, borderRadius: 26 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  dashboard: { paddingHorizontal: 18, gap: 14 },
  row: { flexDirection: 'row', gap: 9 },
});
