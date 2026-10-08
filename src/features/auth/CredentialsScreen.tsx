import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Lock, Mail, User } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { IconButton } from '@/components/IconButton';
import { MotionPressable } from '@/components/MotionPressable';
import { ScreenShell } from '@/components/ScreenShell';
import { useEntry } from './EntryContext';
import { authErrorMessage } from '@/services/AuthService';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, layout, motion, spacing, typography } from '@/theme';

interface Props {
  mode: 'login' | 'register';
}

export default function CredentialsScreen({ mode }: Props) {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const { mode: entryMode, verificationEmail, register, signIn } = useEntry();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(verificationEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectAfterSubmit, setRedirectAfterSubmit] = useState(false);
  const isRegister = mode === 'register';

  useEffect(() => {
    if (redirectAfterSubmit && entryMode === 'verify') router.replace('/(auth)/verify');
  }, [redirectAfterSubmit, entryMode]);

  const submit = async () => {
    if (isRegister && !username.trim()) { setError('Escribe tu nombre de usuario.'); return; }
    if (!email.trim().split('@')[0] || !email.includes('@')) { setError('Escribe un correo electrónico válido.'); return; }
    if (!password) { setError('Escribe tu contraseña.'); return; }
    if (isRegister && password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setWorking(true);
    setError(null);
    setRedirectAfterSubmit(true);
    try {
      if (isRegister) await register(email, password, username);
      else await signIn(email, password);
    } catch (caught) {
      setRedirectAfterSubmit(false);
      setError(authErrorMessage(caught, isRegister));
    } finally {
      setPassword('');
      setConfirmation('');
      setWorking(false);
    }
  };

  return (
    <ScreenShell>
      <IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver" onPress={() => router.back()} />
      <Animated.View entering={FadeInDown.duration(motion.reveal)} style={styles.page}>
        <Text style={styles.eyebrow}>TU ESPACIO EN LA COCINA</Text>
        <Text style={styles.title}>{isRegister ? 'Crear una cuenta' : 'Iniciar sesión'}</Text>
        <Text style={styles.description}>{isRegister ? 'Guarda tus ideas y vuelve a tu cocina cuando quieras.' : 'Continúa donde dejaste tus recetas.'}</Text>
        <View style={styles.form}>
          {isRegister && <AppTextField label="Nombre de usuario" value={username} onChangeText={setUsername} placeholder="Tu nombre" accessibilityLabel="Nombre de usuario" leading={<User color={colors.textMuted} size={iconSizes.md} />} />}
          <AppTextField label="Correo electrónico" value={email} onChangeText={setEmail} placeholder="Tu correo" accessibilityLabel="Correo electrónico" keyboardType="email-address" leading={<Mail color={colors.textMuted} size={iconSizes.md} />} />
          <AppTextField label="Contraseña" value={password} onChangeText={setPassword} placeholder="Tu contraseña" accessibilityLabel="Contraseña" secureTextEntry leading={<Lock color={colors.textMuted} size={iconSizes.md} />} />
          {isRegister && <AppTextField label="Confirmar contraseña" value={confirmation} onChangeText={setConfirmation} placeholder="Repite tu contraseña" accessibilityLabel="Confirmar contraseña" secureTextEntry leading={<Lock color={colors.textMuted} size={iconSizes.md} />} />}
          <View style={styles.submit}>
            <AppButton label={isRegister ? 'Crear cuenta' : 'Iniciar sesión'} onPress={submit} loading={working} icon={<ArrowRight color={colors.inkInverse} size={iconSizes.md} />} />
          </View>
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {!isRegister && <MotionPressable accessibilityLabel="Crear una cuenta" onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
            <View style={styles.registerLine}><Text style={styles.registerPrompt}>¿No tienes cuenta? </Text><Text style={styles.registerAction}>Crear una cuenta</Text></View>
          </MotionPressable>}
        </View>
      </Animated.View>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  page: { paddingTop: spacing.xxl },
  eyebrow: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.sm },
  title: { ...typography.display, color: baseColors.textPrimary },
  description: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.md, maxWidth: 400 },
  form: { gap: spacing.lg, marginTop: spacing.xxl },
  submit: { marginTop: spacing.xs },
  error: { ...typography.bodySmall, color: baseColors.error },
  registerLink: { alignSelf: 'center', minHeight: layout.minTouch, justifyContent: 'center' },
  registerLine: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  registerPrompt: { ...typography.bodySmall, color: baseColors.textSecondary },
  registerAction: { ...typography.bodySmall, color: baseColors.accent, fontWeight: '700' },
});
