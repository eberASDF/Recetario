import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { PreferencesDocument } from '@/models/Preferences';
import type { FreeRecipeRepository } from '@/repositories/contracts';
import { GuestFreeRecipeRepository } from '@/repositories/mock/GuestFreeRecipeRepository';
import { claimFreeRecipeIds } from '@/services/accessRules';
import { readFreeRecipeIds } from './freeRecipeIds';

export class FirebaseFreeRecipeRepository implements FreeRecipeRepository {
  private readonly guest = new GuestFreeRecipeRepository();

  async list(uid: string | null): Promise<string[]> {
    if (!uid) return this.guest.list();
    const snapshot = await getDocFromServer(doc(db, 'userPreferences', uid));
    if (!snapshot.exists()) throw new Error('preferences-missing');
    return readFreeRecipeIds(snapshot.data() as Partial<PreferencesDocument>);
  }

  async claim(uid: string | null, recipeId: string): Promise<string[]> {
    if (!recipeId) throw new Error('recipe-id-missing');
    if (!uid) return this.guest.claim(recipeId);
    const reference = doc(db, 'userPreferences', uid);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error('preferences-missing');
      const ids = readFreeRecipeIds(snapshot.data() as Partial<PreferencesDocument>);
      const next = claimFreeRecipeIds(ids, recipeId);
      if (next === ids) return ids;
      transaction.update(reference, { freeRecipeIds: next, updatedAt: serverTimestamp() });
      return next;
    });
  }
}
