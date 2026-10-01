import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/src/context/theme';

export function BrandSplash({ onFinished }: { onFinished: () => void }) {
  const { colors, isDark } = useAppTheme();
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(10)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => createStyles(colors.ink, colors.muted), [colors.ink, colors.muted]);

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 13, stiffness: 135, mass: 0.8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, damping: 16, stiffness: 150, useNativeDriver: true }),
      ]),
      Animated.delay(520),
      Animated.timing(exit, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]).start(({ finished }) => {
      glowLoop.stop();
      if (finished) onFinished();
    });

    return () => glowLoop.stop();
  }, [exit, glow, logoOpacity, logoScale, onFinished, titleOpacity, titleY]);

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });

  return (
    <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]}>
      <LinearGradient colors={[...colors.gradient]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.glow, { backgroundColor: colors.orbOne, transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image
          source={isDark ? require('../assets/brand/splash-dark.png') : require('../assets/brand/splash-light.png')}
          resizeMode="contain"
          style={styles.logo}
        />
      </Animated.View>
      <Animated.View style={[styles.copy, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Text style={styles.name}>Auronix Seller</Text>
        <Text style={styles.meta}>COMMERCE OPERATIONS</Text>
      </Animated.View>
      <View style={[styles.homeIndicator, { backgroundColor: colors.ink }]} />
    </Animated.View>
  );
}

function createStyles(ink: string, muted: string) {
  return StyleSheet.create({
    root: { zIndex: 9999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    glow: { position: 'absolute', width: 390, height: 390, borderRadius: 999, opacity: 0.72 },
    logoWrap: { width: 176, height: 176, alignItems: 'center', justifyContent: 'center' },
    logo: { width: 176, height: 176 },
    copy: { alignItems: 'center', marginTop: 18 },
    name: { color: ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
    meta: { color: muted, fontSize: 9, fontWeight: '900', letterSpacing: 2.2, marginTop: 8 },
    homeIndicator: { position: 'absolute', bottom: 11, width: 118, height: 4, borderRadius: 999, opacity: 0.2 },
  });
}
