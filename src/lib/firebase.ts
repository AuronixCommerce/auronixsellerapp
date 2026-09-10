import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// Metro selects Firebase's React Native entry, where this export is available.
// @ts-expect-error The default TypeScript resolver reads the browser declaration.
import { getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseReady = Object.values(config).every(Boolean);
export const firebaseApp = getApps().length ? getApp() : initializeApp(config);

export const auth = (() => {
  try {
    return initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(firebaseApp);
  }
})();

export const database = getDatabase(firebaseApp);
