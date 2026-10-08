import { z } from 'zod';
import type { FavoritesRepository } from '@/repositories/contracts';
import { readStored, writeStored } from './storage';

const storageKey = 'recetario:favorites:v1';

export class MockFavoritesRepository implements FavoritesRepository {
  private pending: Promise<void> = Promise.resolve();
  private readonly listeners = new Set<(recipeIds: string[]) => void>();

  listIds(): Promise<string[]> {
    return readStored(storageKey, z.array(z.string()), []);
  }

  private serialize(task: () => Promise<void>): Promise<void> {
    const result = this.pending.then(task, task);
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }

  add(recipeId: string): Promise<void> {
    return this.serialize(async () => {
      const ids = await this.listIds();
      if (!ids.includes(recipeId)) {
        const next = [...ids, recipeId];
        await writeStored(storageKey, next);
        this.listeners.forEach((listener) => listener(next));
      }
    });
  }

  remove(recipeId: string): Promise<void> {
    return this.serialize(async () => {
      const next = (await this.listIds()).filter((id) => id !== recipeId);
      await writeStored(storageKey, next);
      this.listeners.forEach((listener) => listener(next));
    });
  }

  async has(recipeId: string): Promise<boolean> {
    return (await this.listIds()).includes(recipeId);
  }

  subscribe(onChange: (recipeIds: string[]) => void, onError: (error: Error) => void): () => void {
    let active = true;
    let changed = false;
    const listener = (ids: string[]) => {
      changed = true;
      onChange(ids);
    };
    this.listeners.add(listener);
    this.listIds()
      .then((ids) => { if (active && !changed) onChange(ids); })
      .catch((error: Error) => { if (active) onError(error); });
    return () => {
      active = false;
      this.listeners.delete(listener);
    };
  }
}
