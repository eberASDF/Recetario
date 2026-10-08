import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { SubscriptionDocument } from '@/models/Subscription';
import type { SubscriptionRepository } from '@/repositories/contracts';
import type { SubscriptionState } from '@/types/user';
import { subscriptionFromDocument } from './subscriptionDocument';

export class FirebaseSubscriptionRepository implements SubscriptionRepository {
  async get(uid: string): Promise<SubscriptionState> {
    const snapshot = await getDocFromServer(doc(db, 'subscriptions', uid));
    if (!snapshot.exists()) throw new Error('subscription-missing');
    return subscriptionFromDocument(snapshot.data() as Partial<SubscriptionDocument>);
  }

  subscribe(uid: string, onChange: (subscription: SubscriptionState) => void, onError: (error: Error) => void): () => void {
    return onSnapshot(doc(db, 'subscriptions', uid), (snapshot) => {
      try {
        if (!snapshot.exists()) throw new Error('subscription-missing');
        onChange(subscriptionFromDocument(snapshot.data() as Partial<SubscriptionDocument>));
      } catch (error) {
        onError(error instanceof Error ? error : new Error('subscription-invalid'));
      }
    }, onError);
  }
}
