export type RecipeProvider = 'themealdb' | 'spoonacular';

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  note?: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  instruction: string;
  durationMinutes?: number;
}

export interface Nutrition {
  calories?: number;
  proteinGrams?: number;
  carbohydratesGrams?: number;
  fatGrams?: number;
}

export interface Recipe {
  id: string;
  provider: RecipeProvider;
  providerId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  cuisine?: string;
  preparationTimeMinutes?: number;
  cookingTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tags: string[];
  nutrition?: Nutrition;
  sourceUrl?: string;
  contentStatus: 'preview' | 'full';
}

export interface RecipeFilters {
  category?: string;
  cuisine?: string;
  maxTotalMinutes?: number;
  tags?: string[];
}
