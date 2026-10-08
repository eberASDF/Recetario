import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { MotionPressable } from '@/components/MotionPressable';
import { colors as baseColors, useThemeStyles, layout, radii } from '@/theme';

interface Props {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  surface?: boolean;
}

export function IconButton({ icon, label, onPress, disabled, surface = false }: Props) {
  const styles = useThemeStyles(baseStyles);
  return (
    <MotionPressable accessibilityLabel={label} onPress={onPress} disabled={disabled} haptic>
      <View style={[styles.base, surface && styles.surface]}>{icon}</View>
    </MotionPressable>
  );
}

const baseStyles = StyleSheet.create({
  base: { minWidth: layout.minTouch, minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  surface: { backgroundColor: baseColors.surfaceSecondary },
});
