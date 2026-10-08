import assert from 'node:assert/strict';
import test from 'node:test';
import { transitionEntry } from '../src/services/entryFlow.ts';

const loading = () => ({ mode: 'loading', isAuthenticated: false, hasAuthenticatedSession: false });

test('login and register open the app; a restored Firebase session requires biometrics', () => {
  let state = transitionEntry(loading(), { type: 'bootstrap', hasSession: false });
  assert.equal(state.mode, 'welcome');
  state = transitionEntry(state, { type: 'authenticated' });
  assert.deepEqual(state, { mode: 'app', isAuthenticated: true, hasAuthenticatedSession: true });
  state = transitionEntry(loading(), { type: 'bootstrap', hasSession: true });
  assert.deepEqual(state, { mode: 'biometric', isAuthenticated: false, hasAuthenticatedSession: true });
});

test('biometric back shows Welcome while preserving the authenticated state', () => {
  let state = transitionEntry(loading(), { type: 'bootstrap', hasSession: true });
  state = transitionEntry(state, { type: 'welcome' });
  assert.deepEqual(state, { mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: true });
  assert.equal(transitionEntry(loading(), { type: 'bootstrap', hasSession: true }).mode, 'biometric');
});

test('guest entry has no authenticated session and sign-out returns to Welcome', () => {
  let state = transitionEntry(loading(), { type: 'bootstrap', hasSession: false });
  state = transitionEntry(state, { type: 'guest' });
  assert.deepEqual(state, { mode: 'app', isAuthenticated: false, hasAuthenticatedSession: false });
  assert.equal(transitionEntry(loading(), { type: 'bootstrap', hasSession: false }).mode, 'welcome');
  assert.deepEqual(transitionEntry({ mode: 'app', isAuthenticated: true, hasAuthenticatedSession: true }, { type: 'signOut' }), {
    mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: false,
  });
});

test('biometric success opens only when an authenticated session exists', () => {
  const biometric = { mode: 'biometric', isAuthenticated: false, hasAuthenticatedSession: true };
  assert.deepEqual(transitionEntry(biometric, { type: 'biometricSuccess' }), { mode: 'app', isAuthenticated: true, hasAuthenticatedSession: true });
  const welcome = { mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: false };
  assert.equal(transitionEntry(welcome, { type: 'biometricSuccess' }), welcome);
});

test('unverified email enters verification flow without an authenticated or biometric session', () => {
  const verify = transitionEntry(loading(), { type: 'verificationRequired' });
  assert.deepEqual(verify, { mode: 'verify', isAuthenticated: false, hasAuthenticatedSession: false });
  assert.equal(transitionEntry(verify, { type: 'biometricSuccess' }), verify);
});

test('authenticated Home returns to biometric Welcome; guest Home returns to public Welcome', () => {
  const authenticated = { mode: 'app', isAuthenticated: true, hasAuthenticatedSession: true };
  const guest = { mode: 'app', isAuthenticated: false, hasAuthenticatedSession: false };
  const welcome = transitionEntry(authenticated, { type: 'welcome' });
  assert.deepEqual(welcome, { mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: true });
  assert.deepEqual(transitionEntry(welcome, { type: 'biometricSuccess' }), authenticated);
  assert.deepEqual(transitionEntry(guest, { type: 'welcome' }), { mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: false });
});
