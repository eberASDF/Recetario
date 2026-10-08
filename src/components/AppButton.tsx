import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotionPressable } from '@/components/MotionPressable';
import { colors as baseColors, useTheme, useThemeStyles, layout, radii, spacing, typography } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  haptic?: boolean;
}

export function AppButton({ label, onPress, accessibilityLabel, variant = 'primary', disabled, loading, icon, haptic = true }: Props) {
  const { scheme } = useTheme();
  const styles = useThemeStyles(baseStyles);
  const unavailable = Boolean(disabled || loading);
  return (
    <MotionPressable onPress={onPress} accessibilityLabel={accessibilityLabel ?? label} disabled={unavailable} haptic={haptic}>
      <View style={[styles.base, styles[variant], variant === 'primary' && scheme === 'dark' && styles.darkPrimary]}>
        {icon}
        <Text style={[styles.label, variant === 'primary' ? styles.primaryText : styles.otherText]}>{loading ? 'Un momento…' : label}</Text>
      </View>
    </MotionPressable>
  );
}

const baseStyles = StyleSheet.create({
  base: { minHeight: layout.minTouch + spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  primary: { backgroundColor: baseColors.deepGreen },
  darkPrimary: { backgroundColor: '#41664F' },
  secondary: { backgroundColor: baseColors.surfaceSecondary, borderWidth: 1, borderColor: baseColors.border },
  quiet: { backgroundColor: 'transparent' },
  label: { ...typography.label, fontSize: typography.body.fontSize },
  primaryText: { color: baseColors.inkInverse },
  otherText: { color: baseColors.textPrimary },
});
