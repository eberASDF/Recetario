import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import { auth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import type { UserDocument } from '@/models/User';
import type { UserRepository } from '@/repositories/contracts';
import { MockUserRepository } from '@/repositories/mock/MockUserRepository';
import { readStored, writeStored } from '@/repositories/mock/storage';
import type { UserPreferences, UserProfile } from '@/types';

const photoKey = (uid: string) => `recetario:profile-photo:${uid}:v1`;

export class FirebaseUserRepository implements UserRepository {
  private readonly localPreferences = new MockUserRepository();

  async getProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as Partial<UserDocument>;
    if (typeof data.email !== 'string' || typeof data.displayName !== 'string') {
      throw new Error('invalid-user-profile');
    }
    const localPhoto = await readStored(photoKey(user.uid), z.string().nullable(), null);
    return {
      id: user.uid,
      email: data.email,
      username: data.displayName,
      photoUri: localPhoto ?? data.photoURL ?? null,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : user.metadata.creationTime ?? new Date().toISOString(),
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== profile.id) throw new Error('profile-owner-mismatch');
    await writeStored(photoKey(profile.id), profile.photoUri);
  }

  getPreferences(): Promise<UserPreferences> {
    return this.localPreferences.getPreferences();
  }

  updatePreferences(changes: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.localPreferences.updatePreferences(changes);
  }
}
