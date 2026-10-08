import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, runTransaction, serverTimestamp, type WithFieldValue } from 'firebase/firestore';
import { auth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import type { FavoriteDocument } from '@/models/Favorite';
import type { FavoritesRepository } from '@/repositories/contracts';
import { MockFavoritesRepository } from '@/repositories/mock/MockFavoritesRepository';
import { favoriteProvider } from './favoriteIdentity';

export class FirebaseFavoritesRepository implements FavoritesRepository {
  private readonly guest = new MockFavoritesRepository();

  private favorites(uid: string) {
    return collection(db, 'userFavorites', uid, 'favorites');
  }

  private favorite(uid: string, recipeId: string) {
    favoriteProvider(recipeId);
    return doc(this.favorites(uid), recipeId);
  }

  async listIds(): Promise<string[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return this.guest.listIds();
    const snapshot = await getDocs(this.favorites(uid));
    return snapshot.docs.map((item) => item.id);
  }

  async add(recipeId: string): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return this.guest.add(recipeId);
    const provider = favoriteProvider(recipeId);
    const reference = this.favorite(uid, recipeId);
    await runTransaction(db, async (transaction) => {
      if ((await transaction.get(reference)).exists()) return;
      transaction.set(reference, {
        recipeId,
        provider,
        createdAt: serverTimestamp(),
      } satisfies WithFieldValue<FavoriteDocument>);
    });
  }

  async remove(recipeId: string): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return this.guest.remove(recipeId);
    await deleteDoc(this.favorite(uid, recipeId));
  }

  async has(recipeId: string): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    if (!uid) return this.guest.has(recipeId);
    return (await getDoc(this.favorite(uid, recipeId))).exists();
  }

  subscribe(onChange: (recipeIds: string[]) => void, onError: (error: Error) => void): () => void {
    let active = true;
    let sourceGeneration = 0;
    let stopSource: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopSource?.();
      const generation = ++sourceGeneration;
      stopSource = user
        ? onSnapshot(this.favorites(user.uid), (snapshot) => {
            if (active && sourceGeneration === generation) onChange(snapshot.docs.map((item) => item.id));
          }, (error) => { if (active && sourceGeneration === generation) onError(error); })
        : this.guest.subscribe(
            (ids) => { if (active && sourceGeneration === generation) onChange(ids); },
            (error) => { if (active && sourceGeneration === generation) onError(error); },
          );
    }, (error) => { if (active) onError(error); });
    return () => {
      active = false;
      sourceGeneration += 1;
      stopAuth();
      stopSource?.();
    };
  }
}
