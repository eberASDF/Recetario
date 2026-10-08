import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Bookmark } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { FeatureIntro } from '@/components/FeatureIntro';
import { ScreenShell } from '@/components/ScreenShell';
import { ScreenState } from '@/components/ScreenState';
import { useAccessState } from '@/hooks/useAccessState';
import { useOpenRecipe } from '@/hooks/useOpenRecipe';
import { isRecipeLocked } from '@/services/accessRules';
import { recipeService } from '@/services/container';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, spacing, typography } from '@/theme';
import type { Recipe } from '@/types';
import { RecipePreview } from './RecipePreview';

export default function SavedScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const stopSubscription = useRef<(() => void) | null>(null);
  const { state: access, loading: accessLoading, error: accessError } = useAccessState();
  const openRecipe = useOpenRecipe(access);

  const loadSaved = useCallback(() => {
    stopSubscription.current?.();
    setLoading(true);
    setError(false);
    stopSubscription.current = recipeService.subscribeFavorites(
      (items) => {
        setRecipes(items);
        setLoading(false);
        setError(false);
      },
      () => {
        setError(true);
        setLoading(false);
      },
    );
  }, []);
  useFocusEffect(useCallback(() => {
    loadSaved();
    return () => {
      stopSubscription.current?.();
      stopSubscription.current = null;
    };
  }, [loadSaved]));

  return (
    <ScreenShell>
      <FeatureIntro
        eyebrow="Tu selección"
        title="Tus buenos hallazgos, siempre cerca."
        description="Vuelve a las recetas que quieres cocinar otra vez."
        icon={<Bookmark size={iconSizes.lg} color={colors.accent} />}
      />
      {(loading || accessLoading) && <ScreenState kind="loading" title="Abriendo Guardadas" message="Un momento…" />}
      {(error || accessError) && <ScreenState kind="error" title="No pudimos abrir Guardadas" message={accessError ? 'Vuelve a abrir Guardadas para revisar tu acceso.' : 'Inténtalo de nuevo.'} action={error ? { label: 'Reintentar', onPress: loadSaved } : undefined} />}
      {!loading && !accessLoading && !error && !accessError && recipes.length === 0 && <View style={styles.empty}><ScreenState kind="empty" title="Todavía no hay recetas guardadas" message="Explora el catálogo y guarda las que quieras recordar." /></View>}
      {!loading && !accessLoading && !error && !accessError && access && recipes.length > 0 && <View style={styles.list}>
        <Text style={styles.count}>{recipes.length} {recipes.length === 1 ? 'RECETA GUARDADA' : 'RECETAS GUARDADAS'}</Text>
        {recipes.map((recipe) => <RecipePreview key={recipe.id} recipe={recipe} locked={isRecipeLocked(recipe.id, access)} onPress={() => openRecipe(recipe)} />)}
      </View>}
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  list: { marginTop: spacing.xl },
  count: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.sm },
  empty: { marginTop: spacing.lg },
});
