import { useState } from 'react';
import { Search } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextField } from '@/components/AppTextField';
import { FeatureIntro } from '@/components/FeatureIntro';
import { ScreenShell } from '@/components/ScreenShell';
import { ScreenState } from '@/components/ScreenState';
import { RecipePreview } from '@/features/recipes/RecipePreview';
import { useAccessState } from '@/hooks/useAccessState';
import { useOpenRecipe } from '@/hooks/useOpenRecipe';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import { isRecipeLocked } from '@/services/accessRules';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, spacing, typography } from '@/theme';

export default function SearchScreen() {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const [query, setQuery] = useState('');
  const search = useRecipeSearch(query);
  const { state: access, loading: accessLoading, error: accessError } = useAccessState();
  const openRecipe = useOpenRecipe(access);
  return (
    <ScreenShell>
      <FeatureIntro
        eyebrow="Explora a tu manera"
        title="Encuentra algo que te inspire."
        description="Busca por nombre, cocina o categoría."
        icon={<Search size={iconSizes.lg} color={colors.accent} />}
      />
      <View style={styles.search}>
        <AppTextField value={query} onChangeText={setQuery} placeholder="¿Qué te gustaría cocinar?" accessibilityLabel="Buscar recetas" leading={<Search color={colors.accent} size={iconSizes.md} />} clearable returnKeyType="search" />
      </View>
      {search.status === 'idle' && !accessError && <View style={styles.empty}><ScreenState kind="empty" title="Una idea empieza aquí" message="Escribe el nombre de un plato o un tipo de cocina para explorar recetas." /></View>}
      {(search.status === 'typing' || search.status === 'loading' || (search.status === 'results' && accessLoading)) && <ScreenState kind="loading" title="Buscando sabores" message="Un momento…" />}
      {search.status === 'error' && <ScreenState kind="error" title="No pudimos buscar" message="Revisa la conexión o inténtalo con otra palabra." />}
      {accessError && <ScreenState kind="error" title="No pudimos revisar tu acceso" message="Vuelve a abrir Buscar para intentarlo de nuevo." />}
      {search.status === 'empty' && !accessError && <ScreenState kind="empty" title="Sin resultados" message="Prueba con otro nombre, cocina o categoría." />}
      {search.status === 'results' && !accessLoading && !accessError && access && (
        <View style={styles.results}>
          <Text style={styles.count}>{search.recipes.length} {search.recipes.length === 1 ? 'RECETA' : 'RECETAS'}</Text>
          {search.recipes.map((recipe) => <RecipePreview key={recipe.id} recipe={recipe} locked={isRecipeLocked(recipe.id, access)} onPress={() => openRecipe(recipe)} />)}
        </View>
      )}
    </ScreenShell>
  );
}

const baseStyles = StyleSheet.create({
  search: { marginTop: spacing.xl },
  results: { marginTop: spacing.xl },
  count: { ...typography.caption, color: baseColors.accent, marginBottom: spacing.sm },
  empty: { marginTop: spacing.lg },
});
