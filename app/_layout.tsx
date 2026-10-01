import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { BrandSplash } from '@/components/brand-splash';
import { AuthProvider } from '@/src/context/auth';
import { ThemeProvider, useAppTheme } from '@/src/context/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 260, fade: true });

function AppShell() {
  const { colors, isDark } = useAppTheme();
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const finishSplash = useCallback(() => setShowBrandSplash(false), []);

  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade_from_bottom',
            animationDuration: 260,
          }}
        />
        {showBrandSplash ? <BrandSplash onFinished={finishSplash} /> : null}
      </View>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
