import type { AccessState } from '@/types';

export const FREE_RECIPE_LIMIT = 3;

export function remainingFreeRecipes(state: AccessState): number {
  return Math.max(0, FREE_RECIPE_LIMIT - state.unlockedRecipeIds.length);
}

export function canAccessRecipe(recipeId: string, state: AccessState): boolean {
  if (state.subscription.tier === 'subscribed' && state.subscription.isActive) return true;
  return state.unlockedRecipeIds.includes(recipeId) || remainingFreeRecipes(state) > 0;
}

export function isRecipeLocked(recipeId: string, state: AccessState): boolean {
  return !canAccessRecipe(recipeId, state);
}

export function claimFreeRecipeId(recipeId: string, state: AccessState): AccessState {
  if (state.subscription.tier === 'subscribed' && state.subscription.isActive) return state;
  const next = claimFreeRecipeIds(state.unlockedRecipeIds, recipeId);
  return next === state.unlockedRecipeIds ? state : { ...state, unlockedRecipeIds: next };
}

export function claimFreeRecipeIds(ids: string[], recipeId: string): string[] {
  if (ids.includes(recipeId) || ids.length >= FREE_RECIPE_LIMIT) return ids;
  return [...ids, recipeId];
}
