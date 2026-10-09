import { router } from 'expo-router';
import { ArrowLeft, Bell } from '@doodle-icons/react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandWordmark } from '@/components/BrandWordmark';
import { AppButton } from '@/components/AppButton';
import { IconButton } from '@/components/IconButton';
import { ScreenShell } from '@/components/ScreenShell';
import { ScreenState } from '@/components/ScreenState';
import { UserAvatar } from '@/components/UserAvatar';
import { DoodleStar } from '@/components/doodles';
import { RecipePreview } from '@/features/recipes/RecipePreview';
import { useEntry } from '@/features/auth/EntryContext';
import { useRecipes } from '@/hooks/useRecipes';
import { useAccessState } from '@/hooks/useAccessState';
import { useOpenRecipe } from '@/hooks/useOpenRecipe';
import { FREE_RECIPE_LIMIT, isRecipeLocked, remainingFreeRecipes } from '@/services/accessRules';
import { scheduleSavedRecipesNotification } from '@/services/localNotification';
import { colors as baseColors, useTheme, useThemeColors, useThemeStyles, iconSizes, layout, motion, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { scheme } = useTheme();
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const { showWelcome, profile, isAuthenticated } = useEntry();
  const { width } = useWindowDimensions();
  const { recipes, loading, error, reload } = useRecipes();
  const { state: access, loading: accessLoading, error: accessError } = useAccessState();
  const openRecipe = useOpenRecipe(access);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const testNotification = async () => {
    setNotificationBusy(true);
    setNotificationError(null);
    try {
      const scheduled = await scheduleSavedRecipesNotification();
      if (!scheduled && mounted.current) {
        setNotificationError('Activa las notificaciones en los ajustes del teléfono para probar esta función.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      console.error(`[Notificación local] ${message}\n${stack ?? ''}`);
      if (mounted.current) {
        setNotificationError('No pudimos programar la notificación. Inténtalo de nuevo.');
      }
    } finally {
      if (mounted.current) setNotificationBusy(false);
    }
  };

  return (
    <ScreenShell>
      <View style={styles.header}>
        <View style={styles.headerStart}>
          <IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver a bienvenida" onPress={showWelcome} />
          <BrandWordmark />
        </View>
        <UserAvatar photoUri={isAuthenticated ? profile?.photoUri : null} username={isAuthenticated ? profile?.username : undefined} onPress={() => router.push('/perfil')} />
      </View>

      <Animated.View entering={FadeInDown.duration(motion.reveal)} style={[styles.hero, scheme === 'dark' && styles.darkHero]}>
        <View style={styles.plateOuter}><View style={styles.plateInner} /></View>
        <View style={styles.sparkle}><DoodleStar color={colors.accentSecondary} size={34} rotation={-12} /></View>
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>INSPIRACIÓN PARA TU MESA</Text>
          <Text style={[styles.heroTitle, width < 375 && styles.heroTitleSmall]}>Hoy se antoja <Text style={styles.heroAccent}>cocinar.</Text></Text>
          <Text style={styles.heroBody}>Explora sabores, guarda ideas y haz de cada receta un momento tuyo.</Text>
        </View>
      </Animated.View>

      {__DEV__ && <View style={styles.notificationAction}>
        <AppButton label="Notificación" variant="secondary" icon={<Bell color={colors.textPrimary} size={iconSizes.md} />} onPress={testNotification} loading={notificationBusy} />
        {notificationError && <Text accessibilityRole="alert" style={styles.notificationError}>{notificationError}</Text>}
      </View>}

      {access && <View style={styles.accessStrip}>
        <Text style={styles.accessLabel}>{access.subscription.tier === 'subscribed' && access.subscription.isActive ? 'CATÁLOGO COMPLETO' : 'TU SELECCIÓN GRATUITA'}</Text>
        <Text style={styles.accessCount}>{access.subscription.tier === 'subscribed' && access.subscription.isActive ? 'Sin límites' : `${remainingFreeRecipes(access)} de ${FREE_RECIPE_LIMIT} por descubrir`}</Text>
      </View>}

      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionIndex}>01 / DESCUBRE</Text><Text style={styles.sectionTitle}>Recetas para explorar</Text></View>
        {!loading && !error && <Text style={styles.count}>{recipes.length.toString().padStart(2, '0')}</Text>}
      </View>

      {(loading || accessLoading) && <ScreenState kind="loading" title="Preparando la mesa" message="Buscando ideas para ti…" />}
      {error && <ScreenState kind="error" title="Aún no llega el menú" message="No pudimos cargar las recetas en este momento." action={{ label: 'Intentar de nuevo', onPress: reload }} />}
      {accessError && <ScreenState kind="error" title="No pudimos revisar tu acceso" message="Vuelve a abrir Inicio para intentarlo de nuevo." />}
      {!loading && !accessLoading && !error && !accessError && recipes.length === 0 && <ScreenState kind="empty" title="Nada por aquí todavía" message="Las recetas aparecerán aquí cuando haya una fuente disponible." />}
      {!loading && !accessLoading && !error && !accessError && access && recipes.map((recipe, index) => (
        <RecipePreview key={recipe.id} recipe={recipe} featured={index === 0} locked={isRecipeLocked(recipe.id, access)} onPress={() => openRecipe(recipe)} />
      ))}
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headerStart: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  hero: { minHeight: 304, marginHorizontal: -layout.gutter, paddingHorizontal: layout.gutter, backgroundColor: baseColors.deepGreen, overflow: 'hidden', justifyContent: 'center' },
  darkHero: { backgroundColor: '#254535' },
  plateOuter: { position: 'absolute', width: 280, height: 280, right: -92, top: -40, borderRadius: 150, borderWidth: 22, borderColor: '#245747', opacity: 0.9 },
  plateInner: { position: 'absolute', width: 144, height: 144, right: 46, top: 46, borderRadius: 80, backgroundColor: '#2A624F' },
  sparkle: { position: 'absolute', right: spacing.xl, bottom: spacing.xl },
  heroContent: { paddingVertical: spacing.xl, maxWidth: 340 },
  heroEyebrow: { ...typography.caption, color: baseColors.accentSecondary, marginBottom: spacing.lg },
  heroTitle: { ...typography.display, color: baseColors.inkInverse, maxWidth: 310 },
  heroTitleSmall: { fontSize: 41, lineHeight: 45 },
  heroAccent: { color: baseColors.accentSecondary, fontStyle: 'italic' },
  heroBody: { ...typography.bodySmall, color: '#DCECE2', maxWidth: 260, marginTop: spacing.lg },
  notificationAction: { marginTop: spacing.lg, gap: spacing.xs },
  notificationError: { ...typography.bodySmall, color: baseColors.error },
  accessStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: baseColors.border, paddingVertical: spacing.md, marginTop: spacing.lg },
  accessLabel: { ...typography.caption, color: baseColors.textSecondary },
  accessCount: { ...typography.bodySmall, color: baseColors.deepGreen, fontWeight: '700' },
  sectionHeading: { marginTop: spacing.xxl, marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionIndex: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.xs },
  sectionTitle: { ...typography.heading, color: baseColors.textPrimary, fontSize: 31, lineHeight: 36, maxWidth: 260 },
  count: { ...typography.title, color: baseColors.textMuted },
});
