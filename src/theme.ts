import { Platform } from 'react-native';

export const colors = {
  ink: '#F5F8FC',
  muted: '#91A0B4',
  background: '#050A12',
  surface: 'rgba(17, 27, 43, 0.78)',
  surfaceStrong: '#101B2C',
  border: 'rgba(255,255,255,0.12)',
  accent: '#65B9FF',
  accentStrong: '#1788ED',
  success: '#52D69B',
  warning: '#FFC96B',
  danger: '#FF7B86',
};

export const typography = {
  display: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};
