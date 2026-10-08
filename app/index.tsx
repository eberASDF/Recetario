import { Redirect } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ScreenShell } from '@/components/ScreenShell';
import { BrandWordmark } from '@/components/BrandWordmark';
import { useEntry } from '@/features/auth/EntryContext';
import { colors as baseColors, useThemeStyles, motion, spacing, typography } from '@/theme';

export default function EntryIndex() {
  const styles = useThemeStyles(baseStyles);
  const { mode } = useEntry();
  if (mode === 'welcome') return <Redirect href="/(auth)/welcome" />;
  if (mode === 'verify') return <Redirect href="/(auth)/verify" />;
  if (mode === 'biometric') return <Redirect href="/(auth)/biometric" />;
  if (mode === 'app') return <Redirect href="/(tabs)" />;
  return (
    <ScreenShell>
      <Animated.View entering={FadeIn.duration(motion.standard)} style={styles.bootstrap}>
        <BrandWordmark />
        <Text style={styles.message}>Preparando tu espacio…</Text>
      </Animated.View>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  bootstrap: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center' },
  message: { ...typography.bodySmall, color: baseColors.textMuted, marginTop: spacing.lg },
});
