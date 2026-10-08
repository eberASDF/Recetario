import type { Timestamp } from 'firebase/firestore';

export interface UserDocument {
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
