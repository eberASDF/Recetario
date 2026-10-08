import assert from 'node:assert/strict';
import test from 'node:test';
import { BiometricService } from '../src/services/BiometricService.ts';

function client(overrides = {}) {
  return {
    AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
    hasHardwareAsync: async () => true,
    isEnrolledAsync: async () => true,
    supportedAuthenticationTypesAsync: async () => [1, 2],
    authenticateAsync: async () => ({ success: true }),
    ...overrides,
  };
}

test('a successful native result permits entry with a modality-neutral prompt', async () => {
  let options;
  const service = new BiometricService(client({ authenticateAsync: async (value) => {
    options = value;
    return { success: true };
  } }));
  assert.equal(await service.authenticate(), 'success');
  assert.equal(options.disableDeviceFallback, true);
  assert.equal(options.promptMessage, 'Verifica tu identidad para continuar');
  assert.equal(options.biometricsSecurityLevel, undefined);
});

test('capabilities identify fingerprint, face and iris without selecting the method', async () => {
  const service = new BiometricService(client());
  assert.deepEqual(await service.checkAvailability(), {
    hasHardware: true, isEnrolled: true,
    supportsFingerprint: true, supportsFace: true, supportsIris: false,
  });
  const faceOnly = new BiometricService(client({ supportedAuthenticationTypesAsync: async () => [2] }));
  assert.equal((await faceOnly.checkAvailability()).supportsFace, true);
  assert.equal(await faceOnly.authenticate(), 'success');
  const irisOnly = new BiometricService(client({ supportedAuthenticationTypesAsync: async () => [3] }));
  assert.equal((await irisOnly.checkAvailability()).supportsIris, true);
  assert.equal(await irisOnly.authenticate(), 'success');
});

test('unavailable and unenrolled devices never open a prompt', async () => {
  const noHardware = new BiometricService(client({ hasHardwareAsync: async () => false, isEnrolledAsync: async () => { throw new Error('No sensor'); }, authenticateAsync: async () => { throw new Error('Unexpected prompt'); } }));
  const noEnrollment = new BiometricService(client({ isEnrolledAsync: async () => false, authenticateAsync: async () => { throw new Error('Unexpected prompt'); } }));
  assert.equal(await noHardware.authenticate(), 'unavailable');
  assert.equal(await noEnrollment.authenticate(), 'not_enrolled');
  const noTypes = new BiometricService(client({ supportedAuthenticationTypesAsync: async () => [], authenticateAsync: async () => { throw new Error('Unexpected prompt'); } }));
  assert.equal(await noTypes.authenticate(), 'unavailable');
});

test('cancel, wrong biometric and lockout stay in the lock flow', async () => {
  for (const [nativeError, expected] of [['user_cancel', 'cancelled'], ['authentication_failed', 'failed'], ['lockout', 'locked']]) {
    const service = new BiometricService(client({ authenticateAsync: async () => ({ success: false, error: nativeError }) }));
    assert.equal(await service.authenticate(), expected);
  }
});
