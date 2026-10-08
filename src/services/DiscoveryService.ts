import type { DiscoveryRepository } from '@/repositories/contracts';
import type { Recipe } from '@/types';
import type { RecipeService } from './RecipeService';
import type { SubscriptionService } from './SubscriptionService';

export const FREE_SHAKE_LIMIT = 3;

export type DiscoveryResult =
  | { status: 'ready'; recipe: Recipe; remaining: number | null }
  | { status: 'limit' | 'empty' };

export class DiscoveryService {
  private readonly repository: DiscoveryRepository;
  private readonly recipes: RecipeService;
  private readonly subscription: SubscriptionService;

  constructor(
    repository: DiscoveryRepository,
    recipes: RecipeService,
    subscription: SubscriptionService,
  ) {
    this.repository = repository;
    this.recipes = recipes;
    this.subscription = subscription;
  }

  async getUsage(): Promise<{ unlimited: boolean; remaining: number }> {
    const access = await this.subscription.getState();
    const unlimited = access.subscription.tier === 'subscribed' && access.subscription.isActive;
    if (unlimited) return { unlimited: true, remaining: FREE_SHAKE_LIMIT };
    const count = await this.repository.getFreeCount();
    return { unlimited, remaining: Math.max(0, FREE_SHAKE_LIMIT - count) };
  }

  async discover(): Promise<DiscoveryResult> {
    const usage = await this.getUsage();
    if (!usage.unlimited && usage.remaining === 0) return { status: 'limit' };
    const recipe = await this.recipes.discoverRandom();
    if (!recipe) return { status: 'empty' };
    if (usage.unlimited) return { status: 'ready', recipe, remaining: null };
    const count = await this.repository.claimFreeDiscovery(FREE_SHAKE_LIMIT);
    if (count === null) return { status: 'limit' };
    return { status: 'ready', recipe, remaining: FREE_SHAKE_LIMIT - count };
  }
}
