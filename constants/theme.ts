import { createContext, useContext } from 'react';
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

export const ACCENT_PRESETS = [
  { id: 'green',  label: 'Green',  primary: '#4CAF50', primaryLight: '#E8F5E9', primaryLightDark: '#1A3D20' },
  { id: 'blue',   label: 'Blue',   primary: '#2196F3', primaryLight: '#E3F2FD', primaryLightDark: '#1A2D4A' },
  { id: 'orange', label: 'Orange', primary: '#FF9800', primaryLight: '#FFF3E0', primaryLightDark: '#3D2A10' },
  { id: 'purple', label: 'Purple', primary: '#9C27B0', primaryLight: '#F3E5F5', primaryLightDark: '#2A1A3D' },
  { id: 'red',    label: 'Red',    primary: '#F44336', primaryLight: '#FFEBEE', primaryLightDark: '#3D1919' },
  { id: 'teal',   label: 'Teal',   primary: '#009688', primaryLight: '#E0F2F1', primaryLightDark: '#1A3333' },
] as const;

type AccentPresetId = typeof ACCENT_PRESETS[number]['id'];

type ThemeContextValue = { accentColor: string | null; appearanceMode?: 'light' | 'dark' | 'system' };
export const ThemeContext = createContext<ThemeContextValue>({ accentColor: null });

export function useColors() {
  const systemScheme = useColorScheme();
  const { accentColor, appearanceMode } = useContext(ThemeContext);
  const scheme = appearanceMode === 'light' ? 'light' : appearanceMode === 'dark' ? 'dark' : systemScheme;
  const base = scheme === 'dark' ? DarkColors : LightColors;
  if (!accentColor) return base;
  const preset = ACCENT_PRESETS.find((p) => p.primary === accentColor);
  const primaryLight = preset
    ? (scheme === 'dark' ? preset.primaryLightDark : preset.primaryLight)
    : base.primaryLight;
  return { ...base, primary: accentColor, primaryLight };
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
