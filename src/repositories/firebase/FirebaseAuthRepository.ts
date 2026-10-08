import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import type { AuthRepository, AuthVerification } from '@/repositories/contracts';
import { emailVerifiedAfterReload, sendVerificationThenSignOut, verifySignIn } from '@/services/emailVerification';
import { registrationDocuments } from './registrationDocuments';

export class FirebaseAuthRepository implements AuthRepository {
  private authOperation = 0;

  private async duringAuthOperation<T>(action: () => Promise<T>): Promise<T> {
    this.authOperation += 1;
    try { return await action(); } finally { this.authOperation -= 1; }
  }

  observe(onChange: (identity: AuthVerification | null) => void, onError: (error: Error) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (this.authOperation) return;
      if (!user) { onChange(null); return; }
      void (async () => {
        const verified = await emailVerifiedAfterReload(user, reload);
        if (this.authOperation || auth.currentUser?.uid !== user.uid) return;
        if (verified) { onChange({ status: 'verified', uid: user.uid }); return; }
        const email = user.email ?? '';
        await signOut(auth);
        onChange({ status: 'unverified', email });
      })().catch(onError);
    }, onError);
  }

  register(email: string, password: string, displayName: string): Promise<{ uid: string; verificationEmailSent: boolean }> {
    return this.duringAuthOperation(async () => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = credential.user;
      const batch = writeBatch(db);
      const { user, subscription, preferences } = registrationDocuments(email, displayName, serverTimestamp);

      batch.set(doc(db, 'users', uid), user);
      batch.set(doc(db, 'subscriptions', uid), subscription);
      batch.set(doc(db, 'userPreferences', uid), preferences);

      try {
        await batch.commit();
      } catch (error) {
        // Authentication and Firestore are separate services; remove the new account if setup fails.
        await deleteUser(credential.user).catch(() => signOut(auth).catch(() => undefined));
        throw error;
      }
      const verificationEmailSent = await sendVerificationThenSignOut(
        credential.user, sendEmailVerification, () => signOut(auth),
      );
      return { uid, verificationEmailSent };
    });
  }

  signIn(email: string, password: string): Promise<AuthVerification> {
    return this.duringAuthOperation(async () => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const verified = await verifySignIn(credential.user, reload, () => signOut(auth));
      return verified
        ? { status: 'verified', uid: credential.user.uid }
        : { status: 'unverified', email: credential.user.email ?? email };
    });
  }

  async checkCurrentVerification(): Promise<AuthVerification | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const verified = await emailVerifiedAfterReload(user, reload);
    if (auth.currentUser?.uid !== user.uid) return null;
    return verified ? { status: 'verified', uid: user.uid } : { status: 'unverified', email: user.email ?? '' };
  }

  resendVerification(email: string, password: string): Promise<'sent' | 'already_verified'> {
    return this.duringAuthOperation(async () => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      try {
        if (await emailVerifiedAfterReload(credential.user, reload)) return 'already_verified';
        await sendEmailVerification(credential.user);
        return 'sent';
      } finally {
        await signOut(auth);
      }
    });
  }

  signOut(): Promise<void> {
    return signOut(auth);
  }

  currentUid(): string | null {
    return auth.currentUser?.uid ?? null;
  }
}
