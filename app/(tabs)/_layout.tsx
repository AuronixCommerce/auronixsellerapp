import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ColorValue } from 'react-native';
import { IOSSpinner, Screen } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  dashboard: 'home-outline', products: 'cube-outline', catalogs: 'documents-outline', ai: 'sparkles-outline', more: 'grid-outline',
};

function DockIcon({ name, color, size, focused }: { name: keyof typeof Ionicons.glyphMap; color: ColorValue; size: number; focused: boolean }) {
  const { colors } = useAppTheme();
  const active = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { Animated.spring(active, { toValue: focused ? 1 : 0, damping: 15, stiffness: 210, mass: 0.7, useNativeDriver: true }).start(); }, [active, focused]);
  return <Animated.View style={[styles.iconCapsule, { backgroundColor: focused ? colors.accentSoft : 'transparent', transform: [{ scale: active.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) }, { translateY: active.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }]}><Ionicons name={name} color={color} size={focused ? size + 1 : size} /></Animated.View>;
}

export default function TabsLayout() {
  const { user, ready } = useAuth();
  const { colors, isDark } = useAppTheme();
  if (!ready) return <Screen><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><IOSSpinner /></View></Screen>;
  if (!user) return <Redirect href="/login" />;
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarHideOnKeyboard: true,
    tabBarStyle: { position: 'absolute', left: 12, right: 12, bottom: 8, height: 78, paddingTop: 7, paddingBottom: 7, borderTopWidth: 0, borderRadius: 28, backgroundColor: 'transparent', overflow: 'hidden', shadowColor: '#000', shadowOpacity: isDark ? 0.28 : 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
    tabBarBackground: () => <BlurView intensity={isDark ? 58 : 70} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { backgroundColor: colors.tab, borderWidth: 1, borderColor: colors.border, borderRadius: 28 }]} />,
    tabBarLabelStyle: { fontSize: 9, fontWeight: '800', paddingBottom: 1 }, tabBarItemStyle: { borderRadius: 21 }, tabBarIcon: ({ color, size, focused }) => <DockIcon name={icons[route.name] || 'ellipse-outline'} color={color} size={size} focused={focused} />,
  })}>
    <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
    <Tabs.Screen name="products" options={{ title: 'Products' }} />
    <Tabs.Screen name="catalogs" options={{ title: 'Catalogs' }} />
    <Tabs.Screen name="ai" options={{ title: 'AI' }} />
    <Tabs.Screen name="more" options={{ title: 'More' }} />
    <Tabs.Screen name="workspace" options={{ href: null }} />
    <Tabs.Screen name="notifications" options={{ href: null }} />
    <Tabs.Screen name="support" options={{ href: null }} />
    <Tabs.Screen name="account" options={{ href: null }} />
  </Tabs>;
}
const styles = StyleSheet.create({ iconCapsule: { width: 42, height: 32, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } });
