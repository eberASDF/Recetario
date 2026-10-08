import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase/firestore';
import { readFreeRecipeIds } from '../src/repositories/firebase/freeRecipeIds.ts';
import { subscriptionFromDocument } from '../src/repositories/firebase/subscriptionDocument.ts';

test('free recipe IDs reject duplicates and more than three choices', () => {
  assert.deepEqual(readFreeRecipeIds({ freeRecipeIds: ['a', 'b', 'c'] }), ['a', 'b', 'c']);
  for (const ids of [['a', 'a'], ['a', 'b', 'c', 'd'], ['a', '']]) {
    assert.throws(() => readFreeRecipeIds({ freeRecipeIds: ids }), /free-recipe-ids-invalid/);
  }
});

test('subscription access expires at its server timestamp', () => {
  const expiresAt = Timestamp.fromMillis(2000);
  const document = { tier: 'subscribed', isActive: true, expiresAt };
  assert.equal(subscriptionFromDocument(document, 1999).isActive, true);
  assert.equal(subscriptionFromDocument(document, 2000).isActive, false);
  assert.equal(subscriptionFromDocument({ tier: 'free', isActive: true, expiresAt: null }).isActive, false);
  assert.throws(() => subscriptionFromDocument({ tier: 'subscribed', isActive: true }), /subscription-invalid/);
});
