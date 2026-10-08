import { z } from 'zod';
import { fetchJson, type JsonFetcher } from '@/repositories/http';
import type { RecipeSource } from '@/repositories/source';
import type { Recipe } from '@/types';
import { mapSpoonacularRecipe } from './mapRecipe';

const searchSchema = z.object({ results: z.array(z.unknown()) });

// Supply a transport that handles authorization outside the public app build.
export class SpoonacularSource implements RecipeSource {
  readonly provider = 'spoonacular' as const;

  constructor(private readonly fetcher: JsonFetcher) {}

  private request(path: string): Promise<unknown> {
    return fetchJson(`https://api.spoonacular.com/recipes/${path}`, undefined, this.fetcher);
  }

  async list(): Promise<Recipe[]> {
    const response = searchSchema.parse(await this.request('complexSearch?number=12'));
    return response.results.map((item) => mapSpoonacularRecipe(item, 'preview'));
  }

  async search(query: string): Promise<Recipe[]> {
    const response = searchSchema.parse(await this.request(`complexSearch?number=12&query=${encodeURIComponent(query.trim())}`));
    return response.results.map((item) => mapSpoonacularRecipe(item, 'preview'));
  }

  async getById(providerId: string): Promise<Recipe | null> {
    const id = Number(providerId);
    if (!Number.isSafeInteger(id)) return null;
    return mapSpoonacularRecipe(await this.request(`${id}/information?includeNutrition=false`), 'full');
  }
}
