import type { PreferencesDocument } from '@/models/Preferences';
import { FREE_RECIPE_LIMIT } from '../../services/accessRules.ts';

export function readFreeRecipeIds(data: Partial<PreferencesDocument>): string[] {
  const ids = data.freeRecipeIds;
  if (
    !Array.isArray(ids) ||
    ids.length > FREE_RECIPE_LIMIT ||
    ids.some((id) => typeof id !== 'string' || !id) ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error('free-recipe-ids-invalid');
  }
  return ids;
}
