import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors as baseColors, useThemeStyles, iconSizes, motion, spacing, typography } from '@/theme';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export function FeatureIntro({ eyebrow, title, description, icon }: Props) {
  const styles = useThemeStyles(baseStyles);
  return (
    <Animated.View entering={FadeInDown.duration(motion.reveal)} style={styles.container}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Animated.View>
  );
}

const baseStyles = StyleSheet.create({
  container: { marginTop: spacing.xxl },
  icon: { width: iconSizes.xl + spacing.xl, height: iconSizes.xl + spacing.xl, borderRadius: 999, backgroundColor: baseColors.softPeach, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  eyebrow: { ...typography.label, color: baseColors.accent, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...typography.heading, color: baseColors.textPrimary, marginBottom: spacing.md },
  description: { ...typography.body, color: baseColors.textSecondary, maxWidth: 420 },
});
