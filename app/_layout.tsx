import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/src/context/auth';
import { colors } from '@/src/theme';

export default function RootLayout() {
  return <AuthProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }} /></AuthProvider>;
}
