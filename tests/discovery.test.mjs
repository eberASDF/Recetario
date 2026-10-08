import assert from 'node:assert/strict';
import test from 'node:test';
import { DiscoveryService, FREE_SHAKE_LIMIT } from '../src/services/DiscoveryService.ts';
import {
  createShakeDetector,
  RUNNING_ENTER_RMS_G,
  RUNNING_EXIT_RMS_G,
  RUNNING_ENTER_MS,
  RUNNING_EXIT_MS,
} from '../src/utils/shakeDetection.ts';

function makeDiscovery({ subscribed = false, recipe = { id: 'themealdb:1' } } = {}) {
  let count = 0;
  const repository = {
    getFreeCount: async () => count,
    claimFreeDiscovery: async (limit) => {
      if (count >= limit) return null;
      count += 1;
      return count;
    },
  };
  const recipes = { discoverRandom: async () => recipe };
  const subscription = { getState: async () => ({ subscription: { tier: subscribed ? 'subscribed' : 'free', isActive: subscribed } }) };
  return { service: new DiscoveryService(repository, recipes, subscription), count: () => count, recipes };
}

test('FREE counts only successful discoveries and blocks after the limit', async () => {
  const { service, count, recipes } = makeDiscovery();
  assert.equal(FREE_SHAKE_LIMIT, 3);
  recipes.discoverRandom = async () => null;
  assert.deepEqual(await service.discover(), { status: 'empty' });
  assert.equal(count(), 0);
  recipes.discoverRandom = async () => { throw new Error('source failed'); };
  await assert.rejects(service.discover());
  assert.equal(count(), 0);
  recipes.discoverRandom = async () => ({ id: 'themealdb:1' });
  for (let remaining = 2; remaining >= 0; remaining -= 1) {
    const result = await service.discover();
    assert.equal(result.status, 'ready');
    assert.equal(result.remaining, remaining);
  }
  assert.deepEqual(await service.discover(), { status: 'limit' });
  assert.equal(count(), 3);
});

test('SUBSCRIBED discovers without changing FREE usage', async () => {
  const { service, count } = makeDiscovery({ subscribed: true });
  for (let index = 0; index < 5; index += 1) {
    const result = await service.discover();
    assert.equal(result.status, 'ready');
    assert.equal(result.remaining, null);
  }
  assert.equal(count(), 0);
});

test('dynamic RMS ignores static gravity and detects only sustained motion', () => {
  assert.equal(RUNNING_ENTER_RMS_G, 0.54);
  assert.equal(RUNNING_EXIT_RMS_G, 0.36);
  assert.equal(RUNNING_ENTER_MS, 720);
  assert.equal(RUNNING_EXIT_MS, 900);
  const detector = createShakeDetector();
  let detections = 0;
  const still = (time) => { if (detector.sample({ x: 0, y: 0, z: 1 }, time)) detections += 1; };
  const moving = (time) => { if (detector.sample({ x: time % 160 === 0 ? 1.8 : -1.8, y: 0, z: 1 }, time)) detections += 1; };
  for (let time = 0; time <= 3200; time += 80) still(time);
  assert.equal(detections, 0);
  for (let time = 3280; time <= 5200; time += 80) moving(time);
  assert.equal(detections, 1);
  for (let time = 5280; time <= 6000; time += 80) still(time);
  for (let time = 6080; time <= 8000; time += 80) moving(time);
  assert.equal(detections, 1);
  for (let time = 8080; time <= 10400; time += 80) still(time);
  for (let time = 10480; time <= 12400; time += 80) moving(time);
  assert.equal(detections, 2);
});

test('brief movement never reaches the continuous entry interval', () => {
  const detector = createShakeDetector();
  let detected = false;
  for (let time = 0; time <= 1600; time += 80) detected ||= detector.sample({ x: 0, y: 0, z: 1 }, time);
  for (let time = 1680; time <= 1920; time += 80) detected ||= detector.sample({ x: time % 160 === 0 ? 1.8 : -1.8, y: 0, z: 1 }, time);
  for (let time = 2000; time <= 2800; time += 80) detected ||= detector.sample({ x: 0, y: 0, z: 1 }, time);
  assert.equal(detected, false);
});
