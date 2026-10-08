import assert from 'node:assert/strict';
import test from 'node:test';
import { ProfileService } from '../src/services/ProfileService.ts';
import { SubscriptionService } from '../src/services/SubscriptionService.ts';

function makeProfileService() {
  let stored = { id: 'firebase-uid', username: 'Ana', email: 'ana@email.com', photoUri: null, createdAt: '2026-10-01T00:00:00.000Z' };
  const removed = [];
  let failSave = false;
  const repository = {
    getProfile: async () => stored,
    saveProfile: async (profile) => {
      if (failSave) throw new Error('storage failed');
      stored = structuredClone(profile);
    },
  };
  const images = {
    copyToDocuments: async (uri) => `file:///documents/profile-images/copied-${uri.split('/').at(-1)}`,
    deleteOwned: (uri) => { if (uri) removed.push(uri); },
  };
  return {
    service: new ProfileService(repository, images),
    stored: () => stored,
    removed,
    failSave: (next) => { failSave = next; },
  };
}

test('photo replacement preserves the previous image if profile persistence fails', async () => {
  const { service, stored, removed, failSave } = makeProfileService();
  await service.savePhoto('file:///cache/first.jpg');
  failSave(true);
  await assert.rejects(service.savePhoto('file:///cache/second.jpg'));
  assert.equal(stored().photoUri, 'file:///documents/profile-images/copied-first.jpg');
  assert.deepEqual(removed, ['file:///documents/profile-images/copied-second.jpg']);
  failSave(false);
  await service.savePhoto('file:///cache/third.jpg');
  assert.equal(stored().photoUri, 'file:///documents/profile-images/copied-third.jpg');
  assert.equal(removed.at(-1), 'file:///documents/profile-images/copied-first.jpg');
});

test('free recipe choices persist across service instances and never exceed three', async () => {
  let ids = [];
  const subscriptions = { get: async () => ({ tier: 'free', isActive: false }) };
  const freeRecipes = {
    list: async () => [...ids],
    claim: async (_uid, recipeId) => {
      if (!ids.includes(recipeId) && ids.length < 3) ids = [...ids, recipeId];
      return [...ids];
    },
  };
  const first = new SubscriptionService(subscriptions, freeRecipes, () => 'uid-1');
  for (const id of ['a', 'b', 'c']) assert.equal(await first.claimRecipe(id), true);
  const reopened = new SubscriptionService(subscriptions, freeRecipes, () => 'uid-1');
  assert.equal(await reopened.canAccess('b'), true);
  assert.equal(await reopened.canAccess('d'), false);
  assert.equal(await reopened.claimRecipe('d'), false);
  assert.deepEqual(ids, ['a', 'b', 'c']);
});

test('active subscription grants access without consuming free choices', async () => {
  let claims = 0;
  const subscriptions = { get: async () => ({ tier: 'subscribed', isActive: true }) };
  const freeRecipes = {
    list: async () => [],
    claim: async () => { claims += 1; return []; },
  };
  const service = new SubscriptionService(subscriptions, freeRecipes, () => 'uid-1');
  assert.equal(await service.canAccess('new'), true);
  assert.equal(await service.claimRecipe('new'), true);
  assert.equal(claims, 0);
});

test('guest access never reads subscription documents', async () => {
  const subscriptions = { get: async () => { throw new Error('should not read'); } };
  const freeRecipes = { list: async () => ['guest-recipe'], claim: async () => ['guest-recipe'] };
  const service = new SubscriptionService(subscriptions, freeRecipes, () => null);
  assert.deepEqual(await service.getState(), {
    subscription: { tier: 'free', isActive: false },
    unlockedRecipeIds: ['guest-recipe'],
  });
});
