import { Caution, Dish, Sync } from '@doodle-icons/react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, motion, spacing, typography } from '@/theme';

interface Props {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function ScreenState({ kind, title, message, action }: Props) {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const Icon = kind === 'loading' ? Sync : kind === 'error' ? Caution : Dish;
  return (
    <Animated.View entering={FadeIn.duration(motion.standard)} style={styles.container}>
      <Icon size={iconSizes.xl} color={kind === 'error' ? colors.error : colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action && <View style={styles.action}><AppButton label={action.label} onPress={action.onPress} variant="secondary" /></View>}
    </Animated.View>
  );
}

const baseStyles = StyleSheet.create({
  container: { paddingVertical: spacing.xxl, alignItems: 'flex-start' },
  title: { ...typography.title, color: baseColors.textPrimary, marginTop: spacing.lg },
  message: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.xs, maxWidth: 380 },
  action: { marginTop: spacing.lg },
});
