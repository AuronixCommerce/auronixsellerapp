import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppLockScreen } from '@/components/app-lock-screen';
import { BrandSplash } from '@/components/brand-splash';
import { AppLockProvider, useAppLock } from '@/src/context/app-lock';
import { AuthProvider, useAuth } from '@/src/context/auth';
import { ThemeProvider, useAppTheme } from '@/src/context/theme';
import { rawPushHref } from '@/src/lib/deep-links';
import { notificationService } from '@/src/services/notification-service';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 260, fade: true });

function SecureShell() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const { ready: lockReady, enabled: lockEnabled, locked } = useAppLock();
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const initialPushHandled = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!user) {
      initialPushHandled.current = false;
      return;
    }
    void notificationService.register().catch(() => undefined);
    const subscription = notificationService.addResponseListener(href => router.push(rawPushHref(href)));
    if (!initialPushHandled.current) {
      initialPushHandled.current = true;
      void notificationService.lastResponseHref().then(href => {
        if (href) router.push(rawPushHref(href));
      }).catch(() => undefined);
    }
    return () => subscription.remove();
  }, [user]);

  const finishSplash = useCallback(() => setShowBrandSplash(false), []);

  return (
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
      {user && lockReady && lockEnabled && locked && !showBrandSplash ? <AppLockScreen /> : null}
      {showBrandSplash ? <BrandSplash onFinished={finishSplash} /> : null}
    </View>
  );
}

function AppShell() {
  return (
    <AuthProvider>
      <AppLockProvider>
        <SecureShell />
      </AppLockProvider>
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
