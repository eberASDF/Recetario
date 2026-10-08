import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mapTheMealDbMeal } from '../src/repositories/themealdb/mapMeal.ts';
import { mapSpoonacularRecipe } from '../src/repositories/spoonacular/mapRecipe.ts';

const mealSnapshot = JSON.parse(readFileSync(new URL('../src/repositories/fixtures/themealdb.sample.json', import.meta.url), 'utf8'));
const meal = Array.isArray(mealSnapshot) ? mealSnapshot[0] : mealSnapshot.meals[0];

test('TheMealDB normalizes IDs and keeps preview content limited', () => {
  const full = mapTheMealDbMeal(meal);
  const preview = mapTheMealDbMeal(meal, 'preview');
  assert.equal(full.id, `themealdb:${meal.idMeal}`);
  assert.equal(full.provider, 'themealdb');
  assert.ok(full.ingredients.length > 0);
  assert.ok(full.steps.length > 0);
  assert.equal(preview.title, full.title);
  assert.equal(preview.ingredients.length, 0);
  assert.equal(preview.steps.length, 0);
});

test('Spoonacular normalizes recipe details and strips markup', () => {
  const raw = {
    id: 42,
    title: 'Example recipe',
    summary: '<p>A <strong>simple</strong> dish.</p>',
    readyInMinutes: 25,
    cuisines: ['Italian'],
    extendedIngredients: [{ id: 7, name: 'Tomato', amount: 2, unit: 'pieces' }],
    analyzedInstructions: [{ steps: [{ number: 1, step: '<p>Slice tomato.</p>' }] }],
  };
  const full = mapSpoonacularRecipe(raw);
  const preview = mapSpoonacularRecipe(raw, 'preview');
  assert.equal(full.id, 'spoonacular:42');
  assert.equal(full.provider, 'spoonacular');
  assert.equal(full.description, 'A simple dish.');
  assert.equal(full.totalTimeMinutes, 25);
  assert.equal(full.ingredients[0].name, 'Tomato');
  assert.equal(full.steps[0].instruction, 'Slice tomato.');
  assert.deepEqual(preview.ingredients, []);
  assert.deepEqual(preview.steps, []);
});
