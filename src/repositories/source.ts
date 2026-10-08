import type { Recipe, RecipeProvider } from '@/types';

export interface RecipeSource {
  readonly provider: RecipeProvider;
  list(): Promise<Recipe[]>;
  search(query: string): Promise<Recipe[]>;
  getById(providerId: string): Promise<Recipe | null>;
}

export class RecipeSourceUnavailableError extends Error {
  constructor() {
    super('No hay una fuente de recetas configurada.');
  }
}
