import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { IOSSpinner, Screen } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { colors } from '@/src/theme';
import { View } from 'react-native';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { dashboard: 'grid-outline', workspace: 'cube-outline', notifications: 'notifications-outline', support: 'headset-outline', account: 'person-circle-outline' };

export default function TabsLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <Screen><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><IOSSpinner /></View></Screen>;
  if (!user) return <Redirect href="/login" />;
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted, tabBarStyle: { position: 'absolute', height: 82, paddingTop: 8, borderTopColor: colors.border, backgroundColor: 'rgba(7,14,24,.96)' }, tabBarLabelStyle: { fontSize: 10, fontWeight: '700', paddingBottom: 8 }, tabBarIcon: ({ color, size, focused }) => <Ionicons name={icons[route.name] || 'ellipse-outline'} color={color} size={focused ? size + 2 : size} /> })}>
    <Tabs.Screen name="dashboard" options={{ title: 'Home' }} /><Tabs.Screen name="workspace" options={{ title: 'Workspace' }} /><Tabs.Screen name="notifications" options={{ title: 'Updates' }} /><Tabs.Screen name="support" options={{ title: 'Support' }} /><Tabs.Screen name="account" options={{ title: 'Account' }} />
  </Tabs>;
}
