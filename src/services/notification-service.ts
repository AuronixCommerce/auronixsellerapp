import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { request } from '@/src/services/http';

declare const require: (id: string) => unknown;

type NotificationsModule = typeof import('expo-notifications');

const TOKEN_KEY = 'auronix.seller.expo-push-token.v1';
const INSTALLATION_KEY = 'auronix.seller.installation-id.v1';

export type NotificationPreferences = {
  account: boolean;
  products: boolean;
  catalogs: boolean;
  support: boolean;
  security: boolean;
  marketing: boolean;
  updatedAt?: number;
};

let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;

function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient';
}

function nativeNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;
  if (isExpoGo()) {
    notificationsModule = null;
    return null;
  }

  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
    if (!handlerConfigured) {
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      handlerConfigured = true;
    }
    return notificationsModule;
  } catch (error) {
    console.warn('Native push notifications are unavailable in this runtime.', error);
    notificationsModule = null;
    return null;
  }
}

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
  isExpoGo,

  async register() {
    const Notifications = nativeNotifications();
    if (!Notifications) return { registered: false, reason: 'expo-go' as const };

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

  async preferences() {
    return request<{ preferences: NotificationPreferences }>('/api/seller/notification-preferences');
  },

  async updatePreferences(values: Partial<NotificationPreferences>) {
    return request<{ success: true; preferences: NotificationPreferences }>('/api/seller/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
  },

  async systemPermission() {
    const Notifications = nativeNotifications();
    if (!Notifications) return { granted: false, status: 'unsupported', supported: false, reason: 'expo-go' as const };
    const permission = await Notifications.getPermissionsAsync();
    return { granted: permission.granted, status: permission.status, supported: true as const };
  },

  addResponseListener(listener: (href: unknown) => void) {
    const Notifications = nativeNotifications();
    if (!Notifications) return { remove() {} };
    return Notifications.addNotificationResponseReceivedListener(response => listener(response.notification.request.content.data?.href));
  },

  async lastResponseHref() {
    const Notifications = nativeNotifications();
    if (!Notifications) return undefined;
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data?.href;
  },
};
