import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

const STORAGE_KEY = 'auronix.seller.biometric-lock';
const TIMEOUT_KEY = 'auronix.seller.biometric-lock-timeout';
export type AppLockTimeout = 0 | 60_000 | 300_000 | 900_000;

type AppLockValue = {
  ready: boolean;
  available: boolean;
  enabled: boolean;
  locked: boolean;
  biometricName: string;
  lockTimeout: AppLockTimeout;
  unlock: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  setLockTimeout: (timeout: AppLockTimeout) => Promise<void>;
  lockNow: () => void;
};

const AppLockContext = createContext<AppLockValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const [lockTimeout, setLockTimeoutState] = useState<AppLockTimeout>(0);
  const enabledRef = useRef(false);
  const timeoutRef = useRef<AppLockTimeout>(0);
  const backgroundAt = useRef(0);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { timeoutRef.current = lockTimeout; }, [lockTimeout]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [stored, storedTimeout, hardware, enrolled, types] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TIMEOUT_KEY),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        if (!mounted) return;
        const canUse = hardware && enrolled;
        const storedEnabled = stored === '1' && canUse;
        const parsedTimeout = Number(storedTimeout);
        const validTimeout: AppLockTimeout = [0, 60_000, 300_000, 900_000].includes(parsedTimeout) ? parsedTimeout as AppLockTimeout : 0;
        const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
        setBiometricName(hasFace ? 'Face ID' : hasFingerprint ? 'Fingerprint' : 'Biometrics');
        setAvailable(canUse);
        setEnabledState(storedEnabled);
        enabledRef.current = storedEnabled;
        setLockTimeoutState(validTimeout);
        timeoutRef.current = validTimeout;
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
      if (!enabledRef.current) return;
      if (state === 'inactive' || state === 'background') {
        backgroundAt.current = Date.now();
        if (timeoutRef.current === 0) setLocked(true);
      } else if (state === 'active' && backgroundAt.current) {
        if (Date.now() - backgroundAt.current >= timeoutRef.current) setLocked(true);
        backgroundAt.current = 0;
      }
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
      if (result.success) {
        backgroundAt.current = 0;
        setLocked(false);
      }
      return result.success;
    } catch {
      return false;
    }
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    if (!next) {
      await AsyncStorage.setItem(STORAGE_KEY, '0').catch(() => undefined);
      enabledRef.current = false;
      backgroundAt.current = 0;
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

  const setLockTimeout = useCallback(async (timeout: AppLockTimeout) => {
    timeoutRef.current = timeout;
    setLockTimeoutState(timeout);
    await AsyncStorage.setItem(TIMEOUT_KEY, String(timeout)).catch(() => undefined);
  }, []);

  const lockNow = useCallback(() => {
    if (enabledRef.current) setLocked(true);
  }, []);

  const value = useMemo<AppLockValue>(() => ({
    ready,
    available,
    enabled,
    locked,
    biometricName,
    lockTimeout,
    unlock,
    setEnabled,
    setLockTimeout,
    lockNow,
  }), [available, biometricName, enabled, lockNow, locked, lockTimeout, ready, setEnabled, setLockTimeout, unlock]);

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const value = useContext(AppLockContext);
  if (!value) throw new Error('useAppLock must be used inside AppLockProvider.');
  return value;
}
