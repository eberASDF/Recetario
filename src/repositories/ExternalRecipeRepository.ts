import type { RecipeRepository } from '@/repositories/contracts';
import { RecipeSourceUnavailableError, type RecipeSource } from '@/repositories/source';
import type { Recipe, RecipeFilters } from '@/types';

function matches(recipe: Recipe, filters?: RecipeFilters): boolean {
  if (!filters) return true;
  if (filters.category && recipe.category?.toLocaleLowerCase() !== filters.category.toLocaleLowerCase()) return false;
  if (filters.cuisine && recipe.cuisine?.toLocaleLowerCase() !== filters.cuisine.toLocaleLowerCase()) return false;
  if (filters.maxTotalMinutes !== undefined && (recipe.totalTimeMinutes === undefined || recipe.totalTimeMinutes > filters.maxTotalMinutes)) return false;
  if (filters.tags?.length && !filters.tags.every((tag) => recipe.tags.includes(tag))) return false;
  return true;
}

export class ExternalRecipeRepository implements RecipeRepository {
  constructor(private readonly sources: RecipeSource[]) {}

  private async collect(method: 'list' | 'search', query?: string): Promise<Recipe[]> {
    if (!this.sources.length) throw new RecipeSourceUnavailableError();
    const results = await Promise.allSettled(this.sources.map((source) => method === 'list' ? source.list() : source.search(query ?? '')));
    const successful = results.filter((result): result is PromiseFulfilledResult<Recipe[]> => result.status === 'fulfilled');
    if (!successful.length) throw (results[0] as PromiseRejectedResult).reason;
    return successful.flatMap((result) => result.value);
  }

  async list(filters?: RecipeFilters): Promise<Recipe[]> {
    return (await this.collect('list')).filter((recipe) => matches(recipe, filters));
  }

  async search(query: string, filters?: RecipeFilters): Promise<Recipe[]> {
    return (await this.collect('search', query)).filter((recipe) => matches(recipe, filters));
  }

  async getById(id: string): Promise<Recipe | null> {
    const separator = id.indexOf(':');
    if (separator < 0) return null;
    const source = this.sources.find((item) => item.provider === id.slice(0, separator));
    return source?.getById(id.slice(separator + 1)) ?? null;
  }
}
