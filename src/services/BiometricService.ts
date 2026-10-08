type BiometricClient = Pick<typeof import('expo-local-authentication'),
  'hasHardwareAsync' | 'isEnrolledAsync' | 'supportedAuthenticationTypesAsync' | 'authenticateAsync' | 'AuthenticationType'>;

export type BiometricOutcome = 'success' | 'unavailable' | 'not_enrolled' | 'cancelled' | 'failed' | 'locked' | 'error';
export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportsFingerprint: boolean;
  supportsFace: boolean;
  supportsIris: boolean;
}

export class BiometricService {
  private readonly client?: BiometricClient;

  constructor(client?: BiometricClient) {
    this.client = client;
  }

  async checkAvailability(): Promise<BiometricCapability> {
    const client = this.client ?? await import('expo-local-authentication');
    const hasHardware = await client.hasHardwareAsync();
    if (!hasHardware) return { hasHardware: false, isEnrolled: false, supportsFingerprint: false, supportsFace: false, supportsIris: false };
    const types = await client.supportedAuthenticationTypesAsync();
    const isEnrolled = await client.isEnrolledAsync();
    return {
      hasHardware,
      isEnrolled,
      supportsFingerprint: types.includes(client.AuthenticationType.FINGERPRINT),
      supportsFace: types.includes(client.AuthenticationType.FACIAL_RECOGNITION),
      supportsIris: types.includes(client.AuthenticationType.IRIS),
    };
  }

  async authenticate(): Promise<BiometricOutcome> {
    try {
      const client = this.client ?? await import('expo-local-authentication');
      const capability = await this.checkAvailability();
      if (!capability.hasHardware || !(capability.supportsFingerprint || capability.supportsFace || capability.supportsIris)) return 'unavailable';
      if (!capability.isEnrolled) return 'not_enrolled';
      const result = await client.authenticateAsync({
        promptMessage: 'Verifica tu identidad para continuar',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });
      if (result.success) return 'success';
      switch (result.error) {
        case 'user_cancel':
        case 'app_cancel':
        case 'system_cancel':
        case 'user_fallback':
          return 'cancelled';
        case 'not_available':
          return 'unavailable';
        case 'not_enrolled':
          return 'not_enrolled';
        case 'lockout':
          return 'locked';
        case 'authentication_failed':
        case 'timeout':
          return 'failed';
        default:
          return 'error';
      }
    } catch {
      return 'error';
    }
  }
}
