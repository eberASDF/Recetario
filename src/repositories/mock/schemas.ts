import { z } from 'zod';
import type { UserPreferences, UserProfile } from '@/types';

export const preferencesSchema: z.ZodType<UserPreferences> = z.object({
  dietaryTags: z.array(z.string()),
  excludedIngredients: z.array(z.string()),
  measurementSystem: z.enum(['metric', 'imperial']),
  hapticsEnabled: z.boolean(),
  soundEnabled: z.boolean(),
});

export const profileSchema: z.ZodType<UserProfile> = z.object({
  id: z.string(),
  username: z.string().trim().min(1),
  email: z.string().trim().min(1),
  photoUri: z.string().nullable(),
  createdAt: z.string(),
});

