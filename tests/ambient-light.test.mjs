import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAmbientLightDetector,
  DARK_ENTER_LUX,
  DARK_EXIT_LUX,
  LIGHT_STATE_CONFIRM_MS,
} from '../src/utils/ambientLight.ts';

test('ambient light requires stable darkness and light with separate thresholds', () => {
  assert.equal(DARK_ENTER_LUX, 10);
  assert.equal(DARK_EXIT_LUX, 30);
  assert.equal(LIGHT_STATE_CONFIRM_MS, 1500);
  const detector = createAmbientLightDetector('light');
  assert.equal(detector.sample(8, 0), null);
  assert.equal(detector.sample(8, 1499), null);
  assert.equal(detector.sample(8, 1500), 'dark');
  assert.equal(detector.sample(20, 2300), null);
  assert.equal(detector.sample(30, 3000), null);
  assert.equal(detector.sample(29, 4000), null);
  assert.equal(detector.sample(31, 5000), null);
  assert.equal(detector.sample(31, 6499), null);
  assert.equal(detector.sample(31, 6500), 'light');
});

test('invalid light readings never switch themes', () => {
  const detector = createAmbientLightDetector('light');
  assert.equal(detector.sample(-1, 0), null);
  assert.equal(detector.sample(Number.NaN, 2000), null);
  assert.equal(detector.sample(5, 3000), null);
  assert.equal(detector.sample(5, 4500), 'dark');
});
