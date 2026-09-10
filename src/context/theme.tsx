import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { paletteFor, type AppColors, type ResolvedTheme, type ThemeMode } from '@/src/theme';

const STORAGE_KEY = 'auronix.seller.theme';

type ThemeValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted) return;
        if (value === 'light' || value === 'dark' || value === 'system') setModeState(value);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const resolved: ResolvedTheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
  const colors = useMemo(() => paletteFor(resolved), [resolved]);

  const value = useMemo<ThemeValue>(() => ({
    mode,
    resolved,
    isDark: resolved === 'dark',
    colors,
    setMode,
  }), [colors, mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemeProvider.');
  return value;
}
