import type { RecipeProvider } from '@/types/recipe';

export function favoriteProvider(recipeId: string): RecipeProvider {
  const separator = recipeId.indexOf(':');
  const provider = recipeId.slice(0, separator);
  const providerId = recipeId.slice(separator + 1);
  if (
    (provider !== 'themealdb' && provider !== 'spoonacular') ||
    !providerId ||
    providerId.includes('/')
  ) {
    throw new Error('invalid-favorite-recipe-id');
  }
  return provider;
}
