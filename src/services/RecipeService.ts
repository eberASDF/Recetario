import type { FavoritesRepository, RecipeRepository } from '@/repositories/contracts';
import type { Recipe, RecipeFilters } from '@/types';
import { canAccessRecipe } from './accessRules';
import type { SubscriptionService } from './SubscriptionService';

export type OpenRecipeResult =
  | { status: 'ready'; recipe: Recipe }
  | { status: 'locked' | 'missing' };

export class RecipeService {
  constructor(
    private readonly recipes: RecipeRepository,
    private readonly favorites: FavoritesRepository,
    private readonly subscription: SubscriptionService,
    private readonly canSaveFavorites: () => boolean,
  ) {}

  list(filters?: RecipeFilters): Promise<Recipe[]> {
    return this.recipes.list(filters);
  }

  search(query: string, filters?: RecipeFilters): Promise<Recipe[]> {
    return this.recipes.search(query, filters);
  }

  async openRecipe(id: string): Promise<OpenRecipeResult> {
    const access = await this.subscription.getState();
    if (!canAccessRecipe(id, access)) return { status: 'locked' };
    const recipe = await this.recipes.getById(id);
    if (!recipe) return { status: 'missing' };
    if (!(await this.subscription.claimRecipe(id))) return { status: 'locked' };
    return { status: 'ready', recipe };
  }

  async discoverRandom(): Promise<Recipe | null> {
    const recipes = await this.recipes.list();
    return recipes.length ? recipes[Math.floor(Math.random() * recipes.length)] : null;
  }

  async getFavorites(): Promise<Recipe[]> {
    const ids = await this.favorites.listIds();
    return this.resolveFavorites(ids);
  }

  private async resolveFavorites(ids: string[]): Promise<Recipe[]> {
    const recipes = await Promise.all(ids.map((id) => this.recipes.getById(id)));
    return recipes.filter((recipe): recipe is Recipe => recipe !== null);
  }

  subscribeFavoriteIds(onChange: (ids: string[]) => void, onError: (error: Error) => void): () => void {
    return this.favorites.subscribe(onChange, onError);
  }

  subscribeFavorites(onChange: (recipes: Recipe[]) => void, onError: (error: Error) => void): () => void {
    let active = true;
    let revision = 0;
    const stop = this.favorites.subscribe((ids) => {
      const current = ++revision;
      this.resolveFavorites(ids)
        .then((recipes) => { if (active && revision === current) onChange(recipes); })
        .catch((error: Error) => { if (active && revision === current) onError(error); });
    }, (error) => { if (active) onError(error); });
    return () => {
      active = false;
      revision += 1;
      stop();
    };
  }

  isFavorite(id: string): Promise<boolean> {
    return this.favorites.has(id);
  }

  saveFavorite(id: string): Promise<void> {
    if (!this.canSaveFavorites()) return Promise.reject(new Error('sign-in-required-to-save'));
    return this.favorites.add(id);
  }

  removeFavorite(id: string): Promise<void> {
    if (!this.canSaveFavorites()) return Promise.reject(new Error('sign-in-required-to-save'));
    return this.favorites.remove(id);
  }
}
