import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ArrowRight, ObjectsCamera, Pencil, Photo } from '@doodle-icons/react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/AppButton';
import { IconButton } from '@/components/IconButton';
import { MotionPressable } from '@/components/MotionPressable';
import { ScreenShell } from '@/components/ScreenShell';
import { ScreenState } from '@/components/ScreenState';
import { UserAvatar } from '@/components/UserAvatar';
import { useEntry } from '@/features/auth/EntryContext';
import { subscriptionService } from '@/services/container';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, motion, spacing, typography } from '@/theme';
import type { AccessState } from '@/types';

const imageOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile, saveProfilePhoto, showWelcome, signOut } = useEntry();
  const [access, setAccess] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [working, setWorking] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoWorking, setPhotoWorking] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const pendingPhotoChecked = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    if (!hasLoaded.current) setLoading(true);
    setLoadError(false);
    subscriptionService.getState()
      .then((nextAccess) => { if (active) setAccess(nextAccess); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) { hasLoaded.current = true; setLoading(false); } });
    return () => { active = false; };
  }, []));

  useEffect(() => {
    if (!isAuthenticated || loading || Platform.OS !== 'android' || pendingPhotoChecked.current) return;
    pendingPhotoChecked.current = true;
    let active = true;
    ImagePicker.getPendingResultAsync()
      .then(async (result) => {
        if (!active || !result) return;
        if ('code' in result) throw new Error('pending-picker-error');
        if (result.canceled || !result.assets[0]?.uri) return;
        await saveProfilePhoto(result.assets[0].uri);
      })
      .catch(() => { if (active) setPhotoError('No fue posible recuperar la foto seleccionada.'); });
    return () => { active = false; };
  }, [isAuthenticated, loading, saveProfilePhoto]);

  const closeSession = async () => {
    setWorking(true);
    setSessionError(false);
    try {
      await signOut();
    } catch {
      setSessionError(true);
    } finally {
      setWorking(false);
    }
  };

  const choosePhoto = async (source: 'camera' | 'gallery') => {
    if (photoWorking) return;
    setPhotoSheetOpen(false);
    setPhotoError(null);
    setPhotoWorking(true);
    try {
      if (Platform.OS === 'web') {
        setPhotoError('La foto de perfil se cambia desde la app móvil.');
        return;
      }
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPhotoError('Necesitamos acceso a la cámara para tomar una foto.');
          return;
        }
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(imageOptions)
        : await ImagePicker.launchImageLibraryAsync(imageOptions);
      if (result.canceled) return;
      const uri = result.assets[0]?.uri;
      if (!uri) throw new Error('missing-image');
      await saveProfilePhoto(uri);
    } catch {
      setPhotoError(source === 'camera' ? 'No fue posible abrir la cámara o guardar la foto.' : 'No fue posible cargar la imagen.');
    } finally {
      setPhotoWorking(false);
    }
  };

  const subscribed = access?.subscription.tier === 'subscribed' && access.subscription.isActive;

  return (
    <ScreenShell>
      <View style={styles.top}>
        <IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver" onPress={() => router.back()} />
        <Text style={styles.topTitle}>Perfil</Text>
      </View>
      {loading ? <ScreenState kind="loading" title="Abriendo tu espacio" message="Un momento…" /> : loadError ? (
        <ScreenState kind="error" title="No pudimos abrir tu perfil" message="Vuelve a entrar para intentarlo de nuevo." />
      ) : isAuthenticated && profile ? (
        <Animated.View entering={FadeInDown.duration(motion.reveal)}>
          <View style={styles.identity}>
            <Animated.View key={profile.photoUri ?? 'initial'} entering={FadeIn.duration(motion.standard)} style={styles.avatarControl}>
              <UserAvatar photoUri={profile.photoUri} username={profile.username} size={120} onPress={() => { if (!photoWorking) setPhotoSheetOpen(true); }} accessibilityLabel="Editar foto de perfil" />
              <MotionPressable onPress={() => setPhotoSheetOpen(true)} disabled={photoWorking} accessibilityLabel="Editar foto" style={styles.editPhoto}>
                <Pencil color={colors.accent} size={iconSizes.sm} /><Text style={styles.editPhotoText}>Editar foto</Text>
              </MotionPressable>
            </Animated.View>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            {photoError && <Text accessibilityRole="alert" style={styles.error}>{photoError}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CUENTA</Text>
            <View style={styles.infoRow}>
              <Text style={styles.accountStatus}>{subscribed ? 'Suscripción activa' : 'Cuenta gratuita'}</Text>
            </View>
            <View style={styles.subscriptionAction}>
              <AppButton
                label={subscribed ? 'Ver suscripción' : 'Explorar suscripción'}
                onPress={() => router.push('/suscripcion')}
                icon={<ArrowRight color={colors.inkInverse} size={iconSizes.md} />}
              />
            </View>
          </View>

          <View style={styles.signOut}>
            <AppButton label="Cerrar sesión" onPress={closeSession} loading={working} variant="quiet" />
            {sessionError && <Text accessibilityRole="alert" style={styles.error}>No pudimos cerrar la sesión. Inténtalo otra vez.</Text>}
          </View>
        </Animated.View>
      ) : isAuthenticated ? (
        <ScreenState kind="error" title="No pudimos abrir tu perfil" message="Vuelve a iniciar sesión para completar tus datos." action={{ label: 'Cerrar sesión', onPress: () => void closeSession() }} />
      ) : (
        <Animated.View entering={FadeInDown.duration(motion.reveal)}>
          <Text style={styles.guestTitle}>Tu cocina empieza aquí.</Text>
          <Text style={styles.guestIntro}>Inicia sesión para guardar tu perfil y tus recetas.</Text>
          <View style={styles.guestAction}><AppButton label="Volver a bienvenida" onPress={showWelcome} icon={<ArrowRight color={colors.inkInverse} size={iconSizes.md} />} /></View>
        </Animated.View>
      )}

      <Modal visible={photoSheetOpen} transparent animationType="none" onRequestClose={() => setPhotoSheetOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} accessibilityLabel="Cerrar opciones de foto" onPress={() => setPhotoSheetOpen(false)} />
          <Animated.View entering={SlideInDown.duration(motion.standard)} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <Text style={styles.sheetTitle}>Editar foto</Text>
            <MotionPressable accessibilityLabel="Tomar foto" onPress={() => void choosePhoto('camera')} style={styles.sheetAction}>
              <View style={styles.sheetActionInner}><ObjectsCamera color={colors.textPrimary} size={iconSizes.md} /><Text style={styles.sheetActionText}>Tomar foto</Text></View>
            </MotionPressable>
            <MotionPressable accessibilityLabel="Elegir de la galería" onPress={() => void choosePhoto('gallery')} style={styles.sheetAction}>
              <View style={styles.sheetActionInner}><Photo color={colors.textPrimary} size={iconSizes.md} /><Text style={styles.sheetActionText}>Elegir de la galería</Text></View>
            </MotionPressable>
            <MotionPressable accessibilityLabel="Cancelar" onPress={() => setPhotoSheetOpen(false)} style={styles.sheetAction}>
              <View style={styles.sheetActionInner}><Text style={styles.cancelText}>Cancelar</Text></View>
            </MotionPressable>
          </Animated.View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  topTitle: { ...typography.label, color: baseColors.textSecondary },
  identity: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  avatarControl: { alignItems: 'center' },
  editPhoto: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, minHeight: 32 },
  editPhotoText: { ...typography.bodySmall, color: baseColors.accent, fontWeight: '700' },
  username: { ...typography.heading, color: baseColors.textPrimary, textAlign: 'center', marginTop: spacing.lg },
  email: { ...typography.bodySmall, color: baseColors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  section: { borderTopWidth: 1, borderTopColor: baseColors.border, paddingTop: spacing.lg },
  sectionLabel: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.md },
  infoRow: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: baseColors.border },
  accountStatus: { ...typography.body, color: baseColors.textPrimary },
  subscriptionAction: { marginTop: spacing.lg },
  signOut: { borderTopWidth: 1, borderTopColor: baseColors.border, marginTop: spacing.xxl, paddingTop: spacing.lg },
  error: { ...typography.bodySmall, color: baseColors.error, textAlign: 'center', marginTop: spacing.md },
  guestTitle: { ...typography.heading, color: baseColors.textPrimary, marginTop: spacing.xxl },
  guestIntro: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.md },
  guestAction: { marginTop: spacing.xxl },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: baseColors.overlay },
  sheet: { backgroundColor: baseColors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  sheetTitle: { ...typography.title, color: baseColors.textPrimary, marginBottom: spacing.md },
  sheetAction: { borderTopWidth: 1, borderTopColor: baseColors.border },
  sheetActionInner: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetActionText: { ...typography.body, color: baseColors.textPrimary },
  cancelText: { ...typography.body, color: baseColors.textSecondary },
});
