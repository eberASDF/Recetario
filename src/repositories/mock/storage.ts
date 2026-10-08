import AsyncStorage from '@react-native-async-storage/async-storage';
import type { z } from 'zod';

export async function readStored<T>(key: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export async function writeStored<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeStored(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
