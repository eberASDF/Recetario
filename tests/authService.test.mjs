import assert from 'node:assert/strict';
import test from 'node:test';
import { FirebaseError } from 'firebase/app';
import { AuthService, authErrorMessage } from '../src/services/AuthService.ts';
import { emailVerifiedAfterReload, sendVerificationThenSignOut, verifySignIn } from '../src/services/emailVerification.ts';

test('AuthService normalizes identity but passes the password unchanged', async () => {
  const calls = [];
  const repository = {
    register: async (...args) => { calls.push(['register', ...args]); return { uid: 'uid-1', verificationEmailSent: true }; },
    signIn: async (...args) => { calls.push(['signIn', ...args]); return { status: 'verified', uid: 'uid-1' }; },
    resendVerification: async (...args) => { calls.push(['resendVerification', ...args]); return 'sent'; },
  };
  const service = new AuthService(repository);
  await service.register(' Ana@Example.com ', '  pass word  ', ' Ana ');
  await service.signIn(' ANA@example.com ', '  pass word  ');
  await service.resendVerification(' ANA@example.com ', '  pass word  ');
  assert.deepEqual(calls, [
    ['register', 'ana@example.com', '  pass word  ', 'Ana'],
    ['signIn', 'ana@example.com', '  pass word  '],
    ['resendVerification', 'ana@example.com', '  pass word  '],
  ]);
});

test('verification reads Firebase user only after reload, and fails closed', async () => {
  const user = { emailVerified: false };
  assert.equal(await emailVerifiedAfterReload(user, async (current) => { current.emailVerified = true; }), true);
  assert.equal(await emailVerifiedAfterReload(user, async (current) => { current.emailVerified = false; }), false);
  await assert.rejects(emailVerifiedAfterReload(user, async () => { throw new Error('offline'); }), /offline/);
});

test('registration sends verification and signs out even if delivery fails', async () => {
  const calls = [];
  const user = { uid: 'uid-1' };
  assert.equal(await sendVerificationThenSignOut(user, async () => { calls.push('send'); }, async () => { calls.push('signOut'); }), true);
  assert.deepEqual(calls, ['send', 'signOut']);
  calls.length = 0;
  assert.equal(await sendVerificationThenSignOut(user, async () => { calls.push('send'); throw new Error('offline'); }, async () => { calls.push('signOut'); }), false);
  assert.deepEqual(calls, ['send', 'signOut']);
});

test('unverified login signs out; verified login stays signed in', async () => {
  const user = { emailVerified: false };
  const calls = [];
  assert.equal(await verifySignIn(user, async () => { calls.push('reload'); }, async () => { calls.push('signOut'); }), false);
  assert.deepEqual(calls, ['reload', 'signOut']);
  calls.length = 0;
  assert.equal(await verifySignIn(user, async (current) => { calls.push('reload'); current.emailVerified = true; }, async () => { calls.push('signOut'); }), true);
  assert.deepEqual(calls, ['reload']);
});

test('authentication errors give actionable messages without exposing SDK details', () => {
  assert.equal(authErrorMessage(new FirebaseError('auth/invalid-credential', 'raw SDK message'), false), 'Correo o contraseña incorrectos.');
  assert.equal(authErrorMessage(new FirebaseError('auth/email-already-in-use', 'raw SDK message'), true), 'Ese correo ya tiene una cuenta. Inicia sesión.');
  assert.equal(authErrorMessage(new Error('profile-missing'), false), 'No encontramos los datos de tu cuenta. Comunícate con soporte.');
});
