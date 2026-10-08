import type { Timestamp } from 'firebase/firestore';

export interface PreferencesDocument {
  theme: 'system' | 'light' | 'dark';
  language: string;
  defaultServings: number;
  diet: string | null;
  excludedIngredients: string[];
  preferredCuisines: string[];
  preferredCategories: string[];
  freeRecipeIds: string[];
  updatedAt: Timestamp;
}
