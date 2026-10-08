import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FREE_RECIPE_LIMIT,
  canAccessRecipe,
  claimFreeRecipeId,
  isRecipeLocked,
  remainingFreeRecipes,
} from '../src/services/accessRules.ts';

const free = (ids) => ({
  subscription: { tier: 'free', isActive: false },
  unlockedRecipeIds: ids,
});

test('FREE grants exactly three distinct recipe slots', () => {
  assert.equal(FREE_RECIPE_LIMIT, 3);
  for (let count = 0; count < FREE_RECIPE_LIMIT; count += 1) {
    assert.equal(canAccessRecipe('themealdb:new', free(['a', 'b', 'c'].slice(0, count))), true);
    assert.equal(remainingFreeRecipes(free(['a', 'b', 'c'].slice(0, count))), 3 - count);
  }
  assert.equal(isRecipeLocked('themealdb:new', free(['a', 'b', 'c'])), true);
  assert.equal(canAccessRecipe('b', free(['a', 'b', 'c'])), true);
  assert.equal(remainingFreeRecipes(free(['a', 'b', 'c'])), 0);
});

test('claiming IDs keeps the first three choices stable', () => {
  let state = free([]);
  for (const id of ['a', 'b', 'a', 'c', 'd']) state = claimFreeRecipeId(id, state);
  assert.deepEqual(state.unlockedRecipeIds, ['a', 'b', 'c']);
  assert.equal(claimFreeRecipeId('d', state), state);
});

test('SUBSCRIBED unlocks all recipes only while active', () => {
  const active = { subscription: { tier: 'subscribed', isActive: true }, unlockedRecipeIds: ['a', 'b', 'c'] };
  const expired = { ...active, subscription: { ...active.subscription, isActive: false } };
  assert.equal(canAccessRecipe('spoonacular:999', active), true);
  assert.equal(isRecipeLocked('spoonacular:999', expired), true);
});
