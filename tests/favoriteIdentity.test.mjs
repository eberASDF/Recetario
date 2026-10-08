import assert from 'node:assert/strict';
import test from 'node:test';
import { favoriteProvider } from '../src/repositories/firebase/favoriteIdentity.ts';

test('favorite IDs map to their recipe providers', () => {
  assert.equal(favoriteProvider('themealdb:52772'), 'themealdb');
  assert.equal(favoriteProvider('spoonacular:12345'), 'spoonacular');
});

test('favorite IDs cannot escape the document path or use an unknown provider', () => {
  for (const id of ['', '52772', 'unknown:52772', 'themealdb:', 'themealdb:52/772']) {
    assert.throws(() => favoriteProvider(id), /invalid-favorite-recipe-id/);
  }
});
