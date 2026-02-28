import { useColorScheme } from 'react-native';

export const LightColors = {
  primary: '#4CAF50',
  primaryLight: '#E8F5E9',
  background: '#F7F8FA',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  white: '#FFFFFF',
};

export const DarkColors = {
  primary: '#4CAF50',
  primaryLight: '#1A3D20',
  background: '#1C1C1E',
  card: '#2C2C2E',
  text: '#F2F2F7',
  textSecondary: '#8E8E93',
  border: '#3A3A3C',
  danger: '#FF453A',
  dangerLight: '#3D1919',
  white: '#FFFFFF',
};

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}

// Fallback alias for any missed references
export const Colors = LightColors;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
};
