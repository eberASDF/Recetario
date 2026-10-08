import type { RecipeSource } from '@/repositories/source';
import type { Recipe } from '@/types';
import { mapTheMealDbMeal } from '@/repositories/themealdb/mapMeal';
import snapshot from './themealdb.sample.json';

// Real TheMealDB response captured for offline development only.
export class DevMealSnapshotSource implements RecipeSource {
  readonly provider = 'themealdb' as const;

  async list(): Promise<Recipe[]> {
    return snapshot.map((item) => mapTheMealDbMeal(item, 'preview'));
  }

  async search(query: string): Promise<Recipe[]> {
    const normalized = query.trim().toLocaleLowerCase();
    return (await this.list()).filter((recipe) => `${recipe.title} ${recipe.category} ${recipe.cuisine}`.toLocaleLowerCase().includes(normalized));
  }

  async getById(providerId: string): Promise<Recipe | null> {
    const item = snapshot.find((meal) => meal.idMeal === providerId);
    return item ? mapTheMealDbMeal(item, 'full') : null;
  }
}
