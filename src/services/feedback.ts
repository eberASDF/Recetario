import * as Haptics from 'expo-haptics';
import type { UserPreferences } from '@/types';

export async function acknowledgeDiscovery(preferences: UserPreferences): Promise<void> {
  if (preferences.hapticsEnabled) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}
