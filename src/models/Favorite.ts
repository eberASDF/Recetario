import type { Timestamp } from 'firebase/firestore';
import type { RecipeProvider } from '@/types/recipe';

export interface FavoriteDocument {
  recipeId: string;
  provider: RecipeProvider;
  createdAt: Timestamp;
}
