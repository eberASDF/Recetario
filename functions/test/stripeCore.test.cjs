const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCheckoutSession, processStripeEvent } = require('../lib/stripeCore.js');

function database(initial) {
  let data = initial;
  return {
    doc(path) {
      assert.equal(path, 'subscriptions/user-1');
      return {
        async get() { return { exists: !!data, get: (key) => data?.[key] }; },
        async set(patch) { data = { ...data, ...patch }; },
      };
    },
    current() { return data; },
  };
}

test('Checkout rejects a live or nonmonthly price before creating a session', async () => {
  const db = database({ tier: 'free', isActive: false });
  let created = false;
  const stripe = {
    prices: { async retrieve() { return { livemode: true, active: true, recurring: { interval: 'month', interval_count: 1 } }; } },
    checkout: { sessions: { async create() { created = true; } } },
  };
  await assert.rejects(createCheckoutSession(stripe, db, 'user-1', undefined, 'price_test', 'http://localhost:4242/return'), /mensual y de prueba/);
  assert.equal(created, false);
});

test('Checkout does not create another session for an active subscriber', async () => {
  const db = database({ tier: 'subscribed', isActive: true, expiresAt: null });
  const stripe = { prices: { async retrieve() { throw new Error('should not call Stripe'); } } };
  await assert.rejects(createCheckoutSession(stripe, db, 'user-1', undefined, 'price_test', 'http://localhost:4242/return'), /suscripción activa/);
});

test('A test webhook activates only the configured price and persists the Stripe IDs', async () => {
  const db = database({ tier: 'free', isActive: false });
  const future = Math.floor(Date.now() / 1000) + 86400;
  const stripe = {
    subscriptions: { async retrieve(id) {
      assert.equal(id, 'sub_test');
      return {
        id, livemode: false, metadata: { firebaseUid: 'user-1' }, status: 'active',
        customer: 'cus_test', items: { data: [{ price: { id: 'price_test' }, current_period_end: future }] },
      };
    } },
  };
  const event = { livemode: false, type: 'customer.subscription.created', data: { object: { id: 'sub_test' } } };
  await processStripeEvent(stripe, db, 'price_test', event);
  assert.equal(db.current().tier, 'subscribed');
  assert.equal(db.current().isActive, true);
  assert.equal(db.current().stripeSubscriptionId, 'sub_test');
  assert.equal(db.current().provider, 'stripe');

  await assert.rejects(processStripeEvent(stripe, db, 'price_other', event), /precio configurado/);
  await assert.rejects(processStripeEvent(stripe, db, 'price_test', { ...event, livemode: true }), /pagos reales/);
});
