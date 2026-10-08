import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, MailOpen, Send } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { IconButton } from '@/components/IconButton';
import { ScreenShell } from '@/components/ScreenShell';
import { authErrorMessage } from '@/services/AuthService';
import { colors as baseColors, iconSizes, motion, spacing, typography, useThemeColors, useThemeStyles } from '@/theme';
import { useEntry } from './EntryContext';

export default function VerifyEmailScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const { verificationEmail, verificationNotice, verificationCooldownUntil, resendVerification, showWelcome } = useEntry();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const cooldown = now === null
    ? (verificationCooldownUntil > 0 ? 1 : 0)
    : Math.max(0, Math.ceil((verificationCooldownUntil - now) / 1000));

  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    if (working || cooldown > 0 || !verificationEmail) return;
    if (!showPassword) { setShowPassword(true); setFeedback(null); return; }
    if (!password) { setFeedback('Ingresa tu contraseña para reenviar el correo.'); return; }
    setWorking(true);
    setFeedback(null);
    try {
      const result = await resendVerification(password);
      if (result === 'sent') {
        setFeedback('Correo enviado nuevamente.');
        setNow(Date.now());
        setShowPassword(false);
      } else {
        setFeedback('Tu correo ya está verificado. Inicia sesión.');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'verification-cooldown') {
        setFeedback('Espera un momento antes de reenviar el correo.');
        return;
      }
      const message = authErrorMessage(error, false);
      setFeedback(message === 'No pudimos iniciar sesión. Inténtalo de nuevo.'
        ? 'No pudimos enviar el correo de verificación. Intenta nuevamente.' : message);
    } finally {
      setPassword('');
      setWorking(false);
    }
  };

  return (
    <ScreenShell>
      <IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver a bienvenida" onPress={() => { setPassword(''); showWelcome(); }} />
      <Animated.View entering={FadeInDown.duration(motion.reveal)} style={styles.page}>
        <View style={styles.icon}><MailOpen color={colors.accent} size={iconSizes.xl} /></View>
        <Text style={styles.eyebrow}>UN PASO PARA EMPEZAR</Text>
        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.description}>
          {verificationNotice === 'unverified'
            ? 'Primero verifica tu dirección de correo. Revisa el mensaje que te enviamos.'
            : 'Te enviamos un enlace de verificación a:'}
        </Text>
        {verificationEmail && <Text style={styles.email} selectable>{verificationEmail}</Text>}
        <Text style={styles.instruction}>Abre el enlace del correo y después inicia sesión.</Text>
        {verificationNotice === 'send_failed' && <Text accessibilityRole="alert" style={styles.error}>No pudimos enviar el correo de verificación. Intenta nuevamente.</Text>}
        <View style={styles.actions}>
          <AppButton label="Ir a iniciar sesión" onPress={() => { setPassword(''); router.push('/(auth)/login'); }} icon={<ArrowRight color={colors.inkInverse} size={iconSizes.md} />} />
        </View>
        <View style={styles.resendSection}>
          <Text style={styles.resendPrompt}>¿No recibiste el correo?</Text>
          {showPassword && <AppTextField label="Confirma tu contraseña" value={password} onChangeText={setPassword} placeholder="Tu contraseña" accessibilityLabel="Contraseña para reenviar el correo" secureTextEntry />}
          <AppButton
            label={cooldown > 0 ? `Reenviar correo en ${cooldown} s` : showPassword ? 'Confirmar y reenviar' : 'Reenviar correo'}
            onPress={() => void resend()}
            variant="secondary"
            disabled={cooldown > 0 || !verificationEmail}
            loading={working}
            icon={<Send color={colors.textPrimary} size={iconSizes.sm} />}
          />
          {feedback && <Animated.Text entering={FadeInDown.duration(motion.standard)} accessibilityRole="alert" style={styles.feedback}>{feedback}</Animated.Text>}
        </View>
      </Animated.View>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  page: { paddingTop: spacing.xxl },
  icon: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', backgroundColor: baseColors.softPeach, marginBottom: spacing.xl },
  eyebrow: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.sm },
  title: { ...typography.display, color: baseColors.textPrimary, marginBottom: spacing.xs },
  description: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.xl, maxWidth: 400 },
  email: { ...typography.title, color: baseColors.deepGreen, marginTop: spacing.sm },
  instruction: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.lg, maxWidth: 420 },
  actions: { marginTop: spacing.xxl },
  resendSection: { borderTopWidth: 1, borderTopColor: baseColors.border, gap: spacing.md, marginTop: spacing.xxl, paddingTop: spacing.lg },
  resendPrompt: { ...typography.bodySmall, color: baseColors.textSecondary },
  feedback: { ...typography.bodySmall, color: baseColors.textSecondary },
  error: { ...typography.bodySmall, color: baseColors.error, marginTop: spacing.lg },
});
