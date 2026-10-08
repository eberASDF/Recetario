import { router } from 'expo-router';
import { useCallback } from 'react';
import { isRecipeLocked } from '@/services/accessRules';
import type { AccessState, Recipe } from '@/types';

export function useOpenRecipe(access: AccessState | null) {
  return useCallback((recipe: Recipe) => {
    if (!access || isRecipeLocked(recipe.id, access)) {
      router.push('/suscripcion');
      return;
    }
    router.push({ pathname: '/receta/[id]', params: { id: recipe.id } });
  }, [access]);
}
