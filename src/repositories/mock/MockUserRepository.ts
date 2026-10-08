import type { UserRepository } from '@/repositories/contracts';
import type { UserPreferences, UserProfile } from '@/types';
import { preferencesSchema, profileSchema } from './schemas';
import { readStored, writeStored } from './storage';

const profileKey = 'recetario:profile:v2';
const preferencesKey = 'recetario:preferences:v1';

const defaultPreferences: UserPreferences = {
  dietaryTags: [],
  excludedIngredients: [],
  measurementSystem: 'metric',
  hapticsEnabled: true,
  soundEnabled: true,
};

export class MockUserRepository implements UserRepository {
  getProfile(): Promise<UserProfile | null> {
    return readStored(profileKey, profileSchema.nullable(), null);
  }

  saveProfile(profile: UserProfile): Promise<void> {
    return writeStored(profileKey, profileSchema.parse(profile));
  }

  getPreferences(): Promise<UserPreferences> {
    return readStored(preferencesKey, preferencesSchema, defaultPreferences);
  }

  async updatePreferences(changes: Partial<UserPreferences>): Promise<UserPreferences> {
    const preferences = { ...(await this.getPreferences()), ...changes };
    await writeStored(preferencesKey, preferences);
    return preferences;
  }
}
