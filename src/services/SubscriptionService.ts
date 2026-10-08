import type { FreeRecipeRepository, SubscriptionRepository } from '@/repositories/contracts';
import type { AccessState, SubscriptionState } from '@/types';
import { FREE_RECIPE_LIMIT } from './accessRules.ts';

export class SubscriptionService {
  private readonly subscriptions: SubscriptionRepository;
  private readonly freeRecipes: FreeRecipeRepository;
  private readonly currentUid: () => string | null;

  constructor(
    subscriptions: SubscriptionRepository,
    freeRecipes: FreeRecipeRepository,
    currentUid: () => string | null,
  ) {
    this.subscriptions = subscriptions;
    this.freeRecipes = freeRecipes;
    this.currentUid = currentUid;
  }

  private async stateFor(uid: string | null): Promise<AccessState> {
    const [subscription, unlockedRecipeIds] = await Promise.all([
      uid ? this.subscriptions.get(uid) : Promise.resolve({ tier: 'free' as const, isActive: false }),
      this.freeRecipes.list(uid),
    ]);
    return { subscription, unlockedRecipeIds };
  }

  getState(): Promise<AccessState> {
    return this.stateFor(this.currentUid());
  }

  subscribe(onChange: (subscription: SubscriptionState) => void, onError: (error: Error) => void): () => void {
    const uid = this.currentUid();
    if (!uid) {
      onChange({ tier: 'free', isActive: false });
      return () => {};
    }
    return this.subscriptions.subscribe(uid, onChange, onError);
  }

  async canAccess(recipeId: string): Promise<boolean> {
    const state = await this.getState();
    return (state.subscription.tier === 'subscribed' && state.subscription.isActive) ||
      state.unlockedRecipeIds.includes(recipeId);
  }

  async claimRecipe(recipeId: string): Promise<boolean> {
    const uid = this.currentUid();
    const state = await this.stateFor(uid);
    if (state.subscription.tier === 'subscribed' && state.subscription.isActive) return true;
    if (state.unlockedRecipeIds.includes(recipeId)) return true;
    if (state.unlockedRecipeIds.length >= FREE_RECIPE_LIMIT) return false;
    return (await this.freeRecipes.claim(uid, recipeId)).includes(recipeId);
  }
}
