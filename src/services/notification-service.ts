import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { request } from '@/src/services/http';

const TOKEN_KEY = 'auronix.seller.expo-push-token.v1';
const INSTALLATION_KEY = 'auronix.seller.installation-id.v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function installationId() {
  const existing = await AsyncStorage.getItem(INSTALLATION_KEY).catch(() => null);
  if (existing) return existing;
  const value = `seller-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(INSTALLATION_KEY, value);
  return value;
}

function projectId() {
  return Constants.easConfig?.projectId || (Constants.expoConfig?.extra as any)?.eas?.projectId || '';
}

export const notificationService = {
  async register() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('seller-updates', {
        name: 'Seller Updates',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 160, 250],
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return { registered: false, reason: 'permission-denied' as const };

    const easProjectId = projectId();
    if (!easProjectId) return { registered: false, reason: 'eas-project-id-missing' as const };

    const expo = await Notifications.getExpoPushTokenAsync({ projectId: easProjectId });
    const token = expo.data;
    const id = await installationId();
    await request('/api/seller/mobile-push', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS, appVersion: Constants.expoConfig?.version || '1.0.0', installationId: id }),
    });
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => undefined);
    return { registered: true, token };
  },

  async unregister() {
    const token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
    if (!token) return;
    await request(`/api/seller/mobile-push?token=${encodeURIComponent(token)}`, { method: 'DELETE' }).catch(() => undefined);
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
  },

  addResponseListener(listener: (href: unknown) => void) {
    return Notifications.addNotificationResponseReceivedListener(response => listener(response.notification.request.content.data?.href));
  },

  async lastResponseHref() {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data?.href;
  },
};
