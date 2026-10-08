import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

export const colors = {
  background: '#F7F4EC',
  surface: '#FFFEFA',
  surfaceSecondary: '#E9EFE8',
  textPrimary: '#162F28',
  textSecondary: '#506159',
  textMuted: '#78847A',
  accent: '#EF684A',
  accentSecondary: '#F5C94E',
  success: '#3F8A63',
  warning: '#C6802E',
  error: '#BC494B',
  border: '#D8DED5',
  overlay: 'rgba(18, 37, 31, 0.72)',
  inkInverse: '#FFFFFF',
  deepGreen: '#123C31',
  softPeach: '#FCE8DB',
  softLilac: '#E8E2F2',
} as const;

export type ThemeColors = { [K in keyof typeof colors]: string };

export const darkColors: ThemeColors = {
  background: '#1C211F',
  surface: '#252D29',
  surfaceSecondary: '#303B34',
  textPrimary: '#F4F3EA',
  textSecondary: '#D0D7CD',
  textMuted: '#AAB9AD',
  accent: '#FF9A7C',
  accentSecondary: '#F8D778',
  success: '#8BCEA7',
  warning: '#F1BE76',
  error: '#FF9A9C',
  border: '#46564A',
  overlay: 'rgba(18, 28, 23, 0.76)',
  inkInverse: '#FFFFFF',
  deepGreen: '#B3E3C3',
  softPeach: '#4D3834',
  softLilac: '#3A3548',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const opacity = { disabled: 0.46, pressed: 0.78, subdued: 0.62 } as const;
export const iconSizes = { sm: 16, md: 21, lg: 26, xl: 34 } as const;
export const layout = { gutter: 24, maxWidth: 680, minTouch: 44 } as const;

const editorialFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export const typography = {
  display: { fontFamily: editorialFont, fontSize: 48, lineHeight: 52, fontWeight: '700' as const, letterSpacing: -1.8 },
  heading: { fontFamily: editorialFont, fontSize: 36, lineHeight: 42, fontWeight: '700' as const, letterSpacing: -1 },
  title: { fontSize: 25, lineHeight: 31, fontWeight: '700' as const, letterSpacing: -0.5 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.7 },
} as const;

export const shadows = {
  floating: Platform.select({
    ios: { shadowColor: colors.deepGreen, shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.16, shadowRadius: 20 },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

export const motion = {
  quick: 140,
  standard: 260,
  reveal: 420,
  easing: Easing.bezier(0.2, 0.8, 0.2, 1),
} as const;
