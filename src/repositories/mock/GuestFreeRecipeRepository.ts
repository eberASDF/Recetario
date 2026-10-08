import { z } from 'zod';
import { claimFreeRecipeIds, FREE_RECIPE_LIMIT } from '@/services/accessRules';
import { readStored, writeStored } from './storage';

const storageKey = 'recetario:guest-free-recipes:v1';
const legacyKey = 'recetario:access:v1';
const legacySchema = z.object({ unlockedRecipeIds: z.array(z.string()) });

export class GuestFreeRecipeRepository {
  private pending: Promise<void> = Promise.resolve();

  async list(): Promise<string[]> {
    const saved = await readStored(storageKey, z.array(z.string()).nullable(), null);
    if (saved) return [...new Set(saved)].slice(0, FREE_RECIPE_LIMIT);
    const legacy = await readStored(legacyKey, legacySchema.nullable(), null);
    return [...new Set(legacy?.unlockedRecipeIds ?? [])].slice(0, FREE_RECIPE_LIMIT);
  }

  claim(recipeId: string): Promise<string[]> {
    const result = this.pending.then(async () => {
      const ids = await this.list();
      const next = claimFreeRecipeIds(ids, recipeId);
      if (next === ids) return ids;
      await writeStored(storageKey, next);
      return next;
    });
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }
}
