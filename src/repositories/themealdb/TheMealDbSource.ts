import { z } from 'zod';
import { fetchJson, type JsonFetcher } from '@/repositories/http';
import type { RecipeSource } from '@/repositories/source';
import type { Recipe } from '@/types';
import { mapTheMealDbMeal } from './mapMeal';

const responseSchema = z.object({ meals: z.array(z.unknown()).nullable() });

// The base URL is injected; no developer or production key is bundled here.
export class TheMealDbSource implements RecipeSource {
  readonly provider = 'themealdb' as const;

  constructor(private readonly baseUrl: string, private readonly fetcher: JsonFetcher = fetch) {}

  private async meals(path: string): Promise<unknown[]> {
    const response = responseSchema.parse(await fetchJson(`${this.baseUrl.replace(/\/$/, '')}/${path}`, undefined, this.fetcher));
    return response.meals ?? [];
  }

  async list(): Promise<Recipe[]> {
    return (await this.meals('search.php?f=a')).map((meal) => mapTheMealDbMeal(meal, 'preview'));
  }

  async search(query: string): Promise<Recipe[]> {
    return (await this.meals(`search.php?s=${encodeURIComponent(query.trim())}`)).map((meal) => mapTheMealDbMeal(meal, 'preview'));
  }

  async getById(providerId: string): Promise<Recipe | null> {
    const [meal] = await this.meals(`lookup.php?i=${encodeURIComponent(providerId)}`);
    return meal ? mapTheMealDbMeal(meal, 'full') : null;
  }
}
