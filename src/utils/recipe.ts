import type { Recipe } from '@/types';

export function totalMinutes(recipe: Pick<Recipe, 'totalTimeMinutes' | 'preparationTimeMinutes' | 'cookingTimeMinutes'>): number | null {
  if (recipe.totalTimeMinutes !== undefined) return recipe.totalTimeMinutes;
  if (recipe.preparationTimeMinutes === undefined || recipe.cookingTimeMinutes === undefined) return null;
  return recipe.preparationTimeMinutes + recipe.cookingTimeMinutes;
}
