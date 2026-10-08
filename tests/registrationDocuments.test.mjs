import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationDocuments } from '../src/repositories/firebase/registrationDocuments.ts';

test('registration creates only the agreed user, free subscription and preference fields', () => {
  const sentinel = { serverTimestamp: true };
  const documents = registrationDocuments('ana@example.com', 'Ana', () => sentinel);

  assert.deepEqual(documents.user, {
    email: 'ana@example.com', displayName: 'Ana', photoURL: null,
    createdAt: sentinel, updatedAt: sentinel,
  });
  assert.deepEqual(documents.subscription, {
    tier: 'free', isActive: false, expiresAt: null, provider: null, updatedAt: sentinel,
  });
  assert.deepEqual(documents.preferences, {
    theme: 'system', language: 'es', defaultServings: 2, diet: null,
    excludedIngredients: [], preferredCuisines: [], preferredCategories: [],
    freeRecipeIds: [], updatedAt: sentinel,
  });
  assert.equal(JSON.stringify(documents).includes('password'), false);
});
