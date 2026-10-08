import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowRight } from '@doodle-icons/react-native';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppButton } from '@/components/AppButton';
import { BrandWordmark } from '@/components/BrandWordmark';
import { ScreenShell } from '@/components/ScreenShell';
import { DoodleBurst } from '@/components/doodles';
import { useEntry } from './EntryContext';
import { useBiometricEntry } from './useBiometricEntry';
import { useBiometricCapability } from './useBiometricCapability';
import { BiometricSymbol } from './BiometricSymbol';
import { colors as baseColors, useTheme, useThemeColors, useThemeStyles, iconSizes, layout, motion, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  const { scheme } = useTheme();
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const { width } = useWindowDimensions();
  const { enterGuest, hasAuthenticatedSession } = useEntry();
  const [guestError, setGuestError] = useState<string | null>(null);
  const { verify, working, message } = useBiometricEntry();
  const { capability, available, message: availabilityMessage } = useBiometricCapability();
  return (
    <ScreenShell>
      <Animated.View entering={FadeInDown.duration(motion.reveal)} style={styles.page}>
        <BrandWordmark />
        <View style={[styles.hero, scheme === 'dark' && styles.darkHero]}>
          <View style={styles.orbit}><View style={styles.orbitInner} /></View>
          {hasAuthenticatedSession ? (
            <View style={styles.biometric}><BiometricSymbol capability={capability} color={colors.accentSecondary} size={iconSizes.xl + spacing.lg} /></View>
          ) : <View style={styles.sparkles}><DoodleBurst color={colors.accentSecondary} size={62} rotation={-12} /></View>}
          <Text style={styles.eyebrow}>{hasAuthenticatedSession ? 'TU COCINA TE ESPERA' : 'BIENVENIDO A TU COCINA'}</Text>
          <Text style={[styles.title, width < 375 && styles.titleSmall]}>{hasAuthenticatedSession ? 'Bienvenido de nuevo.' : 'Cada antojo tiene una historia.'}</Text>
          <Text style={styles.description}>{hasAuthenticatedSession ? 'Verifica tu identidad para continuar.' : 'Encuentra inspiración para cocinar a tu manera.'}</Text>
        </View>
        <View style={styles.actions}>
          {hasAuthenticatedSession ? (
            <>
              <AppButton label="Entrar con biometría" onPress={() => void verify()} loading={working} disabled={Boolean(capability && !available)} icon={<BiometricSymbol capability={capability} color={colors.inkInverse} size={iconSizes.md} />} />
              {(message || availabilityMessage) && <Animated.Text entering={FadeInDown.duration(motion.standard)} accessibilityRole="alert" style={styles.feedback}>{message || availabilityMessage}</Animated.Text>}
            </>
          ) : (
            <>
              <AppButton label="Iniciar sesión" onPress={() => router.push('/(auth)/login')} icon={<ArrowRight color={colors.inkInverse} size={iconSizes.md} />} />
              <AppButton label="Entrar sin sesión" onPress={() => void enterGuest().catch(() => setGuestError('No pudimos entrar como invitado. Inténtalo de nuevo.'))} variant="secondary" />
            </>
          )}
          {guestError && <Text accessibilityRole="alert" style={styles.feedback}>{guestError}</Text>}
        </View>
      </Animated.View>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  page: { flex: 1, minHeight: 620 },
  hero: { flex: 1, minHeight: 380, marginTop: spacing.xxl, marginHorizontal: -layout.gutter, paddingHorizontal: layout.gutter, paddingVertical: spacing.xxl, backgroundColor: baseColors.deepGreen, justifyContent: 'flex-end', overflow: 'hidden' },
  darkHero: { backgroundColor: '#254535' },
  orbit: { width: 250, height: 250, borderRadius: 125, borderWidth: 22, borderColor: baseColors.success, opacity: 0.5, position: 'absolute', top: -50, right: -70 },
  orbitInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: baseColors.success, opacity: 0.5, position: 'absolute', top: 45, left: 45 },
  sparkles: { position: 'absolute', right: spacing.xl, top: spacing.xxl },
  biometric: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#245747', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  eyebrow: { ...typography.caption, color: baseColors.accentSecondary, marginBottom: spacing.md },
  title: { ...typography.display, color: baseColors.inkInverse, maxWidth: 440 },
  titleSmall: { fontSize: 42, lineHeight: 46 },
  description: { ...typography.body, color: baseColors.inkInverse, opacity: 0.84, marginTop: spacing.lg, maxWidth: 300 },
  actions: { gap: spacing.sm, paddingTop: spacing.xl },
  feedback: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center' },
});
