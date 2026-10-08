import type { FieldValue, WithFieldValue } from 'firebase/firestore';
import type { PreferencesDocument } from '@/models/Preferences';
import type { SubscriptionDocument } from '@/models/Subscription';
import type { UserDocument } from '@/models/User';

export function registrationDocuments(email: string, displayName: string, timestamp: () => FieldValue): {
  user: WithFieldValue<UserDocument>;
  subscription: WithFieldValue<SubscriptionDocument>;
  preferences: WithFieldValue<PreferencesDocument>;
} {
  return {
    user: {
      email,
      displayName,
      photoURL: null,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    },
    subscription: {
      tier: 'free',
      isActive: false,
      expiresAt: null,
      provider: null,
      updatedAt: timestamp(),
    },
    preferences: {
      theme: 'system',
      language: 'es',
      defaultServings: 2,
      diet: null,
      excludedIngredients: [],
      preferredCuisines: [],
      preferredCategories: [],
      freeRecipeIds: [],
      updatedAt: timestamp(),
    },
  };
}
