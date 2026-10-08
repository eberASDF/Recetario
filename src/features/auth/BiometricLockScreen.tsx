import { ArrowLeft } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppButton } from '@/components/AppButton';
import { IconButton } from '@/components/IconButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useEntry } from './EntryContext';
import { useBiometricEntry } from './useBiometricEntry';
import { useBiometricCapability } from './useBiometricCapability';
import { BiometricSymbol } from './BiometricSymbol';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, motion, spacing, typography } from '@/theme';

export default function BiometricLockScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const { showWelcome } = useEntry();
  const { verify, working, message } = useBiometricEntry();
  const { capability, available, message: availabilityMessage } = useBiometricCapability();
  const methods = capability?.supportsIris && (capability.supportsFingerprint || capability.supportsFace) ? 'Biometría disponible'
    : capability?.supportsFingerprint && capability.supportsFace ? 'Huella o reconocimiento facial'
    : capability?.supportsFace ? 'Reconocimiento facial'
      : capability?.supportsFingerprint ? 'Huella digital'
        : capability?.supportsIris ? 'Reconocimiento de iris' : null;

  return (
    <ScreenShell>
      <IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver a bienvenida" onPress={showWelcome} />
      <Animated.View entering={FadeInDown.duration(motion.reveal)} style={styles.page}>
        <Text style={styles.eyebrow}>TU COCINA TE ESPERA</Text>
        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.description}>Verifica tu identidad para continuar.</Text>
        <View style={styles.fingerprintArea}>
          <View style={styles.outerRing}><View style={styles.innerRing}><BiometricSymbol capability={capability} color={colors.deepGreen} size={78} /></View></View>
        </View>
        {available && methods && <Text style={styles.method}>{methods}</Text>}
        <AppButton label="Entrar con biometría" onPress={() => void verify()} loading={working} disabled={Boolean(capability && !available)} />
        {(message || availabilityMessage) && <Animated.Text entering={FadeInDown.duration(motion.standard)} accessibilityRole="alert" style={styles.feedback}>{message || availabilityMessage}</Animated.Text>}
      </Animated.View>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  page: { paddingTop: spacing.xxl },
  eyebrow: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.sm },
  title: { ...typography.display, color: baseColors.textPrimary },
  description: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.md },
  fingerprintArea: { minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  outerRing: { width: 216, height: 216, borderRadius: 108, borderWidth: 18, borderColor: baseColors.softPeach, alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 142, height: 142, borderRadius: 71, backgroundColor: baseColors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  feedback: { ...typography.bodySmall, color: baseColors.textSecondary, marginTop: spacing.lg, textAlign: 'center' },
  method: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
});
