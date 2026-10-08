import type { Timestamp } from 'firebase/firestore';
import type { AccessTier } from '@/types/user';

export interface SubscriptionDocument {
  tier: AccessTier;
  isActive: boolean;
  expiresAt: Timestamp | null;
  provider: string | null;
  updatedAt: Timestamp;
}
