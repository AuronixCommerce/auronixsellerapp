import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { invalidateCache, request } from '@/src/services/http';

const INSTALLATION_KEY = 'auronix.seller.installation-id.v1';

export type SecurityDevice = {
  id: string;
  platform?: string;
  platformVersion?: string;
  appVersion?: string;
  deviceLabel?: string;
  firstSeenAt?: number;
  lastSeenAt?: number;
};

export type SecurityEvent = {
  id: string;
  type?: string;
  title?: string;
  installationId?: string;
  platform?: string;
  createdAt?: number;
};

export type SecuritySnapshot = {
  devices: SecurityDevice[];
  events: SecurityEvent[];
  auth: {
    emailVerified: boolean;
    disabled: boolean;
    tokensValidAfterTime: string | null;
    lastSignInTime: string | null;
    creationTime: string | null;
  };
};

async function installationId() {
  const existing = await AsyncStorage.getItem(INSTALLATION_KEY).catch(() => null);
  if (existing) return existing;
  const value = `seller-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(INSTALLATION_KEY, value);
  return value;
}

export const securityService = {
  snapshot: () => request<SecuritySnapshot>('/api/seller/security'),

  async heartbeat() {
    const id = await installationId();
    return request<{ success: true; device: SecurityDevice }>('/api/seller/security', {
      method: 'POST',
      body: JSON.stringify({
        action: 'heartbeat',
        installationId: id,
        platform: Platform.OS,
        platformVersion: String(Platform.Version),
        appVersion: Constants.expoConfig?.version || '1.0.0',
        deviceLabel: `${Platform.OS === 'ios' ? 'iPhone / iPad' : Platform.OS === 'android' ? 'Android' : Platform.OS} seller app`,
      }),
    });
  },

  async requestPasswordReset() {
    const email = auth.currentUser?.email;
    if (!email) throw new Error('No email address is available for this seller account.');
    await sendPasswordResetEmail(auth, email);
    return email;
  },

  revokeAll: () => request<{ success: true; reauthenticate: true }>('/api/seller/security', { method: 'POST', body: JSON.stringify({ action: 'revoke-all' }) }),

  async removeDevice(id: string) {
    const result = await request<{ success: true }>('/api/seller/security', { method: 'POST', body: JSON.stringify({ action: 'remove-device', installationId: id }) });
    await invalidateCache('security');
    return result;
  },
};
