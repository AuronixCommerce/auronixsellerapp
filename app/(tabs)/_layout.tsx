import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { IOSSpinner, Screen } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  dashboard: 'grid-outline',
  workspace: 'cube-outline',
  notifications: 'notifications-outline',
  support: 'headset-outline',
  account: 'person-circle-outline',
};

export default function TabsLayout() {
  const { user, ready } = useAuth();
  const { colors } = useAppTheme();

  if (!ready) {
    return <Screen><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><IOSSpinner /></View></Screen>;
  }
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          height: 84,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.tab,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', paddingBottom: 8 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={icons[route.name] || 'ellipse-outline'} color={color} size={focused ? size + 2 : size} />
        ),
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="workspace" options={{ title: 'Workspace' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Updates' }} />
      <Tabs.Screen name="support" options={{ title: 'Support' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
