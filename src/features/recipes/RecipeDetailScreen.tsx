import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Bookmark, Clock, Dish, Lock, User } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { IconButton } from '@/components/IconButton';
import { ScreenShell } from '@/components/ScreenShell';
import { ScreenState } from '@/components/ScreenState';
import { SignInToSavePrompt } from '@/components/SignInToSavePrompt';
import { useEntry } from '@/features/auth/EntryContext';
import { recipeService } from '@/services/container';
import type { OpenRecipeResult } from '@/services/RecipeService';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, layout, spacing, typography } from '@/theme';
import { totalMinutes } from '@/utils/recipe';

export default function RecipeDetailScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const { isAuthenticated, showWelcome } = useEntry();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [result, setResult] = useState<OpenRecipeResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [signInPrompt, setSignInPrompt] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) return;
    recipeService.openRecipe(id)
      .then((value) => { if (active) setResult(value); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    return recipeService.subscribeFavoriteIds(
      (ids) => {
        setIsSaved(ids.includes(id));
        setSaveError(false);
      },
      () => setSaveError(true),
    );
  }, [id]);

  const recipe = result?.status === 'ready' ? result.recipe : null;
  const minutes = recipe ? totalMinutes(recipe) : null;
  const toggleSaved = async () => {
    if (!recipe || saveLoading) return;
    if (!isAuthenticated) { setSignInPrompt(true); return; }
    setSaveLoading(true);
    setSaveError(false);
    try {
      if (isSaved) await recipeService.removeFavorite(recipe.id);
      else await recipeService.saveFavorite(recipe.id);
      setIsSaved(!isSaved);
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'sign-in-required-to-save') setSignInPrompt(true);
      else setSaveError(true);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <ScreenShell>
      <View style={styles.top}><IconButton icon={<ArrowLeft color={colors.textPrimary} size={iconSizes.lg} />} label="Volver" onPress={() => router.back()} /></View>
      {!id && <ScreenState kind="empty" title="Falta la receta" message="Vuelve a Inicio para elegir una." action={{ label: 'Volver a Inicio', onPress: () => router.replace('/') }} />}
      {id && loading && <ScreenState kind="loading" title="Abriendo la receta" message="Preparando los detalles…" />}
      {error && <ScreenState kind="error" title="No pudimos abrirla" message="Inténtalo otra vez más tarde." action={{ label: 'Volver', onPress: () => router.back() }} />}
      {!loading && !error && result?.status === 'missing' && <ScreenState kind="empty" title="No encontramos esta receta" message="Puede que ya no esté disponible en la fuente." action={{ label: 'Volver a Inicio', onPress: () => router.replace('/') }} />}
      {!loading && !error && result?.status === 'locked' && (
        <View style={styles.locked}>
          <Lock color={colors.accent} size={iconSizes.xl} />
          <Text style={styles.title}>Más sabores te esperan.</Text>
          <Text style={styles.lead}>Ya elegiste tus recetas gratuitas. Con una suscripción activa podrás abrir el catálogo completo.</Text>
          <View style={styles.cta}><AppButton label="Ver suscripción" onPress={() => router.replace('/suscripcion')} /></View>
        </View>
      )}
      {recipe && (
        <View>
          <Text style={styles.eyebrow}>{[recipe.category, recipe.cuisine].filter(Boolean).join(' · ') || recipe.provider.toUpperCase()}</Text>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.metadata}>
            {minutes !== null && <View style={styles.metaItem}><Clock color={colors.textSecondary} size={iconSizes.sm} /><Text style={styles.metaText}>{minutes} min</Text></View>}
            {recipe.servings !== undefined && <View style={styles.metaItem}><User color={colors.textSecondary} size={iconSizes.sm} /><Text style={styles.metaText}>{recipe.servings} porciones</Text></View>}
          </View>
          <View style={styles.imageBleed}>
            {recipe.imageUrl ? <Image source={{ uri: recipe.imageUrl }} accessibilityLabel={recipe.title} contentFit="cover" style={styles.image} /> : <View style={[styles.image, styles.placeholder]}><Dish color={colors.deepGreen} size={iconSizes.xl} /></View>}
          </View>
          <View style={styles.saveAction}>
            <AppButton label={isSaved ? 'Quitar de guardadas' : 'Guardar receta'} onPress={() => void toggleSaved()} loading={saveLoading} variant="secondary" icon={<Bookmark color={colors.deepGreen} size={iconSizes.md} />} />
            {isSaved && <Text style={styles.savedStatus}>GUARDADA</Text>}
          </View>
          {saveError && <Text accessibilityRole="alert" style={styles.saveError}>No pudimos actualizar Guardadas. Inténtalo otra vez.</Text>}
          {recipe.description && <Text style={styles.lead}>{recipe.description}</Text>}
          <Text style={styles.sectionLabel}>LO QUE NECESITAS</Text>
          <Text style={styles.sectionTitle}>Ingredientes</Text>
          {recipe.ingredients.length ? recipe.ingredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.row}><Text style={styles.rowName}>{ingredient.name}</Text><Text style={styles.rowQuantity}>{[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}</Text></View>
          )) : <Text style={styles.muted}>La fuente no indica ingredientes.</Text>}
          <Text style={[styles.sectionLabel, styles.stepSection]}>PASO A PASO</Text>
          <Text style={styles.sectionTitle}>A cocinar</Text>
          {recipe.steps.length ? recipe.steps.map((step) => (
            <View key={step.id} style={styles.step}><Text style={styles.stepNumber}>{step.order}.</Text><Text style={styles.stepText}>{step.instruction}</Text></View>
          )) : <Text style={styles.muted}>La fuente no indica pasos.</Text>}
          <Text style={styles.attribution}>Fuente: {recipe.provider === 'themealdb' ? 'TheMealDB' : 'Spoonacular'}</Text>
        </View>
      )}
      <SignInToSavePrompt
        visible={signInPrompt}
        onCancel={() => setSignInPrompt(false)}
        onSignIn={() => {
          setSignInPrompt(false);
          showWelcome();
          requestAnimationFrame(() => router.replace('/(auth)/login'));
        }}
      />
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  top: { alignItems: 'flex-start', marginBottom: spacing.xl },
  eyebrow: { ...typography.caption, color: baseColors.accent, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...typography.display, color: baseColors.textPrimary },
  lead: { ...typography.body, color: baseColors.textSecondary, marginTop: spacing.lg },
  metadata: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xl },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  metaText: { ...typography.bodySmall, color: baseColors.textSecondary },
  imageBleed: { marginHorizontal: -layout.gutter, marginBottom: spacing.xl },
  image: { width: '100%', height: 320 },
  saveAction: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  savedStatus: { ...typography.caption, color: baseColors.success },
  saveError: { ...typography.bodySmall, color: baseColors.error, marginBottom: spacing.md },
  placeholder: { backgroundColor: baseColors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { ...typography.caption, color: baseColors.accent, marginTop: spacing.xl },
  sectionTitle: { ...typography.heading, color: baseColors.textPrimary, marginTop: spacing.xs, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: baseColors.border },
  rowName: { ...typography.body, color: baseColors.textPrimary, flex: 1 },
  rowQuantity: { ...typography.bodySmall, color: baseColors.textSecondary },
  stepSection: { marginTop: spacing.xxl },
  step: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: baseColors.border },
  stepNumber: { ...typography.label, color: baseColors.accent, minWidth: 22, paddingTop: 3 },
  stepText: { ...typography.body, color: baseColors.textPrimary, flex: 1 },
  muted: { ...typography.body, color: baseColors.textMuted },
  attribution: { ...typography.caption, color: baseColors.textMuted, marginTop: spacing.xxl },
  locked: { alignItems: 'flex-start', paddingTop: spacing.xxl },
  cta: { marginTop: spacing.xl },
});
