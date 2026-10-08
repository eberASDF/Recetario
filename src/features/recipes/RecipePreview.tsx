import { Image } from 'expo-image';
import { ArrowNe, Clock, Dish, Lock } from '@doodle-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { MotionPressable } from '@/components/MotionPressable';
import { colors as baseColors, useThemeColors, useThemeStyles, iconSizes, spacing, typography } from '@/theme';
import type { Recipe } from '@/types';
import { totalMinutes } from '@/utils/recipe';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  featured?: boolean;
  locked?: boolean;
}

export function RecipePreview({ recipe, onPress, featured = false, locked = false }: Props) {
  const colors = useThemeColors();
  const styles = useThemeStyles(baseStyles);
  const minutes = totalMinutes(recipe);
  const metadata = [recipe.category, recipe.cuisine].filter(Boolean).join(' · ');
  return (
    <MotionPressable onPress={onPress} accessibilityLabel={locked ? `${recipe.title}, bloqueada; ver suscripción` : `Abrir ${recipe.title}`} haptic>
      <View style={[styles.article, featured ? styles.featured : styles.compact]}>
        <View style={[styles.imageWrap, featured ? styles.featuredImage : styles.compactImage]}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} accessibilityLabel={recipe.title} contentFit="cover" transition={250} style={styles.image} />
          ) : (
            <View style={styles.placeholder}><Dish color={colors.deepGreen} size={iconSizes.xl} /></View>
          )}
          {locked && <View style={styles.lockedOverlay}><View style={styles.lockBadge}><Lock color={colors.inkInverse} size={iconSizes.md} /></View><Text style={styles.lockText}>CATÁLOGO COMPLETO</Text></View>}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.kicker}>{metadata || recipe.provider.toUpperCase()}</Text>
          <Text style={featured ? styles.featuredTitle : styles.compactTitle} numberOfLines={featured ? 3 : 2}>{recipe.title}</Text>
          <View style={styles.bottom}>
            <View style={styles.meta}><Clock size={iconSizes.sm} color={colors.textMuted} /><Text style={styles.metaText}>{minutes === null ? 'Tiempo por descubrir' : `${minutes} min`}</Text></View>
            {locked ? <View style={styles.subscribeAction}><Text style={styles.subscribeText}>Ver suscripción</Text><ArrowNe size={iconSizes.sm} color={colors.accent} /></View> : <ArrowNe size={iconSizes.md} color={colors.accent} />}
          </View>
        </View>
      </View>
    </MotionPressable>
  );
}

const baseStyles = StyleSheet.create({
  article: { borderBottomWidth: 1, borderBottomColor: baseColors.border },
  featured: { paddingBottom: spacing.xl, marginBottom: spacing.lg },
  compact: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  imageWrap: { overflow: 'hidden', backgroundColor: baseColors.surfaceSecondary },
  featuredImage: { width: '100%', height: 250, marginBottom: spacing.md },
  compactImage: { width: 116, height: 112 },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: baseColors.overlay, alignItems: 'flex-end', justifyContent: 'space-between', padding: spacing.md },
  lockBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: baseColors.accent, alignItems: 'center', justifyContent: 'center' },
  lockText: { ...typography.caption, color: baseColors.inkInverse, alignSelf: 'flex-start' },
  textWrap: { flex: 1, justifyContent: 'space-between' },
  kicker: { ...typography.caption, color: baseColors.accent, textTransform: 'uppercase', marginBottom: spacing.xs },
  featuredTitle: { ...typography.heading, fontSize: 32, lineHeight: 37, color: baseColors.textPrimary, marginBottom: spacing.sm },
  compactTitle: { ...typography.title, fontSize: 20, lineHeight: 25, color: baseColors.textPrimary },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  metaText: { ...typography.caption, color: baseColors.textMuted },
  subscribeText: { ...typography.caption, color: baseColors.accent },
  subscribeAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
