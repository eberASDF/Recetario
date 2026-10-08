import type {
  AccessState,
  Recipe,
  RecipeFilters,
  UserPreferences,
  UserProfile,
} from '@/types';

export interface RecipeRepository {
  list(filters?: RecipeFilters): Promise<Recipe[]>;
  search(query: string, filters?: RecipeFilters): Promise<Recipe[]>;
  getById(id: string): Promise<Recipe | null>;
}

export interface FavoritesRepository {
  listIds(): Promise<string[]>;
  add(recipeId: string): Promise<void>;
  remove(recipeId: string): Promise<void>;
  has(recipeId: string): Promise<boolean>;
  subscribe(onChange: (recipeIds: string[]) => void, onError: (error: Error) => void): () => void;
}

export interface DiscoveryRepository {
  getFreeCount(): Promise<number>;
  claimFreeDiscovery(limit: number): Promise<number | null>;
}

export interface UserRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(changes: Partial<UserPreferences>): Promise<UserPreferences>;
}

export interface AuthIdentity {
  uid: string;
}

export type AuthVerification = { status: 'verified'; uid: string } | { status: 'unverified'; email: string };
export interface AuthRegistrationResult extends AuthIdentity { verificationEmailSent: boolean; }

export interface AuthRepository {
  observe(onChange: (identity: AuthVerification | null) => void, onError: (error: Error) => void): () => void;
  register(email: string, password: string, displayName: string): Promise<AuthRegistrationResult>;
  signIn(email: string, password: string): Promise<AuthVerification>;
  checkCurrentVerification(): Promise<AuthVerification | null>;
  resendVerification(email: string, password: string): Promise<'sent' | 'already_verified'>;
  signOut(): Promise<void>;
  currentUid(): string | null;
}

export interface SubscriptionRepository {
  get(uid: string): Promise<AccessState['subscription']>;
  subscribe(uid: string, onChange: (subscription: AccessState['subscription']) => void, onError: (error: Error) => void): () => void;
}

export interface FreeRecipeRepository {
  list(uid: string | null): Promise<string[]>;
  claim(uid: string | null, recipeId: string): Promise<string[]>;
}

