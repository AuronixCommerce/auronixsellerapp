import { Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type AppColors = {
  ink: string;
  muted: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceStrong: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  input: string;
  chip: string;
  tab: string;
  overlay: string;
  inverse: string;
  gradient: readonly [string, string, string];
  orbOne: string;
  orbTwo: string;
  glassTint: 'light' | 'dark';
};

export const darkColors: AppColors = {
  ink: '#F7F9FC',
  muted: '#96A4B7',
  background: '#050A12',
  backgroundAlt: '#07111F',
  surface: 'rgba(17, 27, 43, 0.78)',
  surfaceStrong: '#101B2C',
  surfaceSoft: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',
  accent: '#65B9FF',
  accentStrong: '#1788ED',
  accentSoft: 'rgba(101,185,255,0.14)',
  success: '#52D69B',
  successSoft: 'rgba(82,214,155,0.14)',
  warning: '#FFC96B',
  warningSoft: 'rgba(255,201,107,0.14)',
  danger: '#FF7B86',
  dangerSoft: 'rgba(255,123,134,0.14)',
  input: 'rgba(255,255,255,0.055)',
  chip: 'rgba(255,255,255,0.07)',
  tab: 'rgba(7,14,24,0.96)',
  overlay: 'rgba(0,0,0,0.68)',
  inverse: '#FFFFFF',
  gradient: ['#07111F', '#050A12', '#02050A'],
  orbOne: 'rgba(23,136,237,0.16)',
  orbTwo: 'rgba(68,85,180,0.10)',
  glassTint: 'dark',
};

export const lightColors: AppColors = {
  ink: '#0B1625',
  muted: '#617083',
  background: '#F5F8FC',
  backgroundAlt: '#EEF5FC',
  surface: 'rgba(255,255,255,0.78)',
  surfaceStrong: '#FFFFFF',
  surfaceSoft: 'rgba(11,22,37,0.045)',
  border: 'rgba(15,42,68,0.10)',
  borderStrong: 'rgba(15,42,68,0.17)',
  accent: '#0B7FE5',
  accentStrong: '#0878D8',
  accentSoft: 'rgba(11,127,229,0.11)',
  success: '#14895E',
  successSoft: 'rgba(20,137,94,0.10)',
  warning: '#A66B00',
  warningSoft: 'rgba(166,107,0,0.10)',
  danger: '#D73A49',
  dangerSoft: 'rgba(215,58,73,0.10)',
  input: 'rgba(255,255,255,0.88)',
  chip: 'rgba(11,22,37,0.05)',
  tab: 'rgba(249,251,254,0.97)',
  overlay: 'rgba(15,28,43,0.36)',
  inverse: '#FFFFFF',
  gradient: ['#F8FBFF', '#F3F7FC', '#EDF4FA'],
  orbOne: 'rgba(23,136,237,0.10)',
  orbTwo: 'rgba(87,116,210,0.07)',
  glassTint: 'light',
};

// Kept as a dark fallback for any legacy module that has not yet moved to useAppTheme().
export const colors = darkColors;

export function paletteFor(theme: ResolvedTheme) {
  return theme === 'dark' ? darkColors : lightColors;
}

export const typography = {
  display: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};
