import { Timestamp } from 'firebase/firestore';
import type { SubscriptionDocument } from '@/models/Subscription';
import type { SubscriptionState } from '@/types/user';

export function subscriptionFromDocument(data: Partial<SubscriptionDocument>, nowMs = Date.now()): SubscriptionState {
  if (
    (data.tier !== 'free' && data.tier !== 'subscribed') ||
    typeof data.isActive !== 'boolean' ||
    (data.expiresAt !== null && !(data.expiresAt instanceof Timestamp))
  ) {
    throw new Error('subscription-invalid');
  }
  const isActive = data.tier === 'subscribed' && data.isActive &&
    (data.expiresAt === null || data.expiresAt.toMillis() > nowMs);
  return {
    tier: data.tier,
    isActive,
    ...(data.expiresAt ? { expiresAt: data.expiresAt.toDate().toISOString() } : {}),
  };
}
