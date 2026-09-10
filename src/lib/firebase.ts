import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const clean = (value: string | undefined) => value?.trim().replace(/^['"]|['"]$/g, '');

const config: FirebaseOptions = {
  apiKey: clean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  databaseURL: clean(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL),
  projectId: clean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseReady = missing.length === 0;

if (!firebaseReady) {
  throw new Error(
    `Firebase configuration is incomplete. Missing: ${missing.join(', ')}. ` +
      'Check C:\\Codes\\auronixsellerapp\\.env and restart Metro with --clear.'
  );
}

if (!config.apiKey || config.apiKey.includes('YOUR_') || config.apiKey.includes('apiKey')) {
  throw new Error(
    'EXPO_PUBLIC_FIREBASE_API_KEY is not a valid Firebase Web API key value. ' +
      'Paste only the key itself (normally starts with AIza), not `apiKey:` or the whole Firebase config object.'
  );
}

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);

let firebaseAuth: Auth;
try {
  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (code === 'auth/already-initialized') {
    firebaseAuth = getAuth(firebaseApp);
  } else {
    throw error;
  }
}

export const auth = firebaseAuth;
export const database = getDatabase(firebaseApp);
