export interface UserPreferences {
  dietaryTags: string[];
  excludedIngredients: string[];
  measurementSystem: 'metric' | 'imperial';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  photoUri: string | null;
  createdAt: string;
}

export type AccessTier = 'free' | 'subscribed';

export interface SubscriptionState {
  tier: AccessTier;
  isActive: boolean;
  expiresAt?: string;
}

export interface AccessState {
  subscription: SubscriptionState;
  unlockedRecipeIds: string[];
}

export interface RecipeCollection {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  recipeIds: string[];
  createdAt: string;
  updatedAt: string;
}
