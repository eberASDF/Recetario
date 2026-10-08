import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { useAmbientLightTheme } from '@/hooks/useAmbientLightTheme';
import { colors, darkColors, type ThemeColors } from './tokens';

export type ThemeMode = 'autoAmbient' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('autoAmbient');
  const systemScheme = useColorScheme();
  const ambientScheme = useAmbientLightTheme(mode === 'autoAmbient');
  const scheme = mode === 'autoAmbient' ? ambientScheme ?? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo<ThemeContextValue>(() => ({
    mode, setMode, scheme, colors: scheme === 'dark' ? darkColors : colors,
  }), [mode, scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing');
  return value;
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}

const darkByLight = new Map<string, string>(
  (Object.keys(colors) as (keyof ThemeColors)[]).map((key) => [colors[key], darkColors[key]]),
);

function recolor<T>(value: T): T {
  if (typeof value === 'string') return (darkByLight.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map(recolor) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, recolor(child)])) as T;
  }
  return value;
}

export function useThemeStyles<T extends object>(baseStyles: T): T {
  const { scheme } = useTheme();
  return useMemo(() => scheme === 'dark' ? recolor(baseStyles) : baseStyles, [baseStyles, scheme]);
}
