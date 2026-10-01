import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

const STORAGE_KEY = 'auronix.seller.biometric-lock';

type AppLockValue = {
  ready: boolean;
  available: boolean;
  enabled: boolean;
  locked: boolean;
  biometricName: string;
  unlock: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  lockNow: () => void;
};

const AppLockContext = createContext<AppLockValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [stored, hardware, enrolled, types] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        if (!mounted) return;
        const canUse = hardware && enrolled;
        const storedEnabled = stored === '1' && canUse;
        const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
        setBiometricName(hasFace ? 'Face ID' : hasFingerprint ? 'Fingerprint' : 'Biometrics');
        setAvailable(canUse);
        setEnabledState(storedEnabled);
        enabledRef.current = storedEnabled;
        setLocked(storedEnabled);
      } catch {
        if (mounted) {
          setAvailable(false);
          setEnabledState(false);
          setLocked(false);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();

    const subscription = AppState.addEventListener('change', (state) => {
      if ((state === 'inactive' || state === 'background') && enabledRef.current) setLocked(true);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const unlock = useCallback(async () => {
    if (!enabledRef.current) {
      setLocked(false);
      return true;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Auronix Seller',
        promptSubtitle: 'Confirm it’s you to continue to your seller workspace',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'strong',
      });
      if (result.success) setLocked(false);
      return result.success;
    } catch {
      return false;
    }
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    if (!next) {
      await AsyncStorage.setItem(STORAGE_KEY, '0').catch(() => undefined);
      enabledRef.current = false;
      setEnabledState(false);
      setLocked(false);
      return true;
    }
    if (!available) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable app lock',
        promptSubtitle: 'Confirm your identity to protect Auronix Seller',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'strong',
      });
      if (!result.success) return false;
      await AsyncStorage.setItem(STORAGE_KEY, '1');
      enabledRef.current = true;
      setEnabledState(true);
      setLocked(false);
      return true;
    } catch {
      return false;
    }
  }, [available]);

  const lockNow = useCallback(() => {
    if (enabledRef.current) setLocked(true);
  }, []);

  const value = useMemo<AppLockValue>(() => ({
    ready,
    available,
    enabled,
    locked,
    biometricName,
    unlock,
    setEnabled,
    lockNow,
  }), [available, biometricName, enabled, lockNow, locked, ready, setEnabled, unlock]);

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const value = useContext(AppLockContext);
  if (!value) throw new Error('useAppLock must be used inside AppLockProvider.');
  return value;
}
