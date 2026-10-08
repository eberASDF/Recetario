import { StyleSheet, Text, View } from 'react-native';
import { DoodleFoodAccent } from '@/components/doodles';
import { colors as baseColors, spacing, typography, useThemeColors, useThemeStyles } from '@/theme';

/** Temporary brand composition; replace this component when a final logo asset is available. */
export function BrandWordmark() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  return <View style={styles.root}>
    <View style={styles.mark}><DoodleFoodAccent color={colors.accent} size={22} rotation={-10} /></View>
    <Text style={styles.name}>RECETARIO</Text>
  </View>;
}

const baseStyles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mark: { width: 22, height: 22, justifyContent: 'center' },
  name: { ...typography.label, color: baseColors.deepGreen, letterSpacing: 2 },
});
