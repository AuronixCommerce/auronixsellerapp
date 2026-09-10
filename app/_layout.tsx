import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/src/context/auth';
import { ThemeProvider, useAppTheme } from '@/src/context/theme';

function AppShell() {
  const { colors, isDark } = useAppTheme();
  return (
    <AuthProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
        }}
      />
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
