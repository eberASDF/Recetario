import { z } from 'zod';
import type { DiscoveryRepository } from '@/repositories/contracts';
import { readStored, writeStored } from './storage';

const storageKey = 'recetario:free-discoveries:v1';
const countSchema = z.number().int().nonnegative();

export class MockDiscoveryRepository implements DiscoveryRepository {
  private pending: Promise<void> = Promise.resolve();

  getFreeCount(): Promise<number> {
    return readStored(storageKey, countSchema, 0);
  }

  claimFreeDiscovery(limit: number): Promise<number | null> {
    const task = async () => {
      const count = await this.getFreeCount();
      if (count >= limit) return null;
      const next = count + 1;
      await writeStored(storageKey, next);
      return next;
    };
    const result = this.pending.then(task, task);
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }
}
