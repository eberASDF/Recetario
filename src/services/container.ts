import { FirebaseFavoritesRepository } from '@/repositories/firebase/FirebaseFavoritesRepository';
import { DevMealSnapshotSource } from '@/repositories/fixtures/DevMealSnapshotSource';
import { ExternalRecipeRepository } from '@/repositories/ExternalRecipeRepository';
import { FirebaseSubscriptionRepository } from '@/repositories/firebase/FirebaseSubscriptionRepository';
import { FirebaseFreeRecipeRepository } from '@/repositories/firebase/FirebaseFreeRecipeRepository';
import { FirebaseAuthRepository } from '@/repositories/firebase/FirebaseAuthRepository';
import { FirebaseUserRepository } from '@/repositories/firebase/FirebaseUserRepository';
import { MockDiscoveryRepository } from '@/repositories/mock/MockDiscoveryRepository';
import { BiometricService } from './BiometricService';
import { RecipeService } from './RecipeService';
import { AuthService } from './AuthService';
import { SubscriptionService } from './SubscriptionService';
import { DiscoveryService } from './DiscoveryService';
import { ProfileService } from './ProfileService';
import { ProfileImageService } from './ProfileImageService';

export const repositories = {
  recipes: new ExternalRecipeRepository(__DEV__ ? [new DevMealSnapshotSource()] : []),
  favorites: new FirebaseFavoritesRepository(),
  user: new FirebaseUserRepository(),
  auth: new FirebaseAuthRepository(),
  subscription: new FirebaseSubscriptionRepository(),
  freeRecipes: new FirebaseFreeRecipeRepository(),
  discovery: new MockDiscoveryRepository(),
};

export const subscriptionService = new SubscriptionService(repositories.subscription, repositories.freeRecipes, () => repositories.auth.currentUid());
export const profileService = new ProfileService(repositories.user, new ProfileImageService());
export const recipeService = new RecipeService(repositories.recipes, repositories.favorites, subscriptionService, () => Boolean(repositories.auth.currentUid()));
export const discoveryService = new DiscoveryService(repositories.discovery, recipeService, subscriptionService);
export const authService = new AuthService(repositories.auth);
export const biometricService = new BiometricService();
