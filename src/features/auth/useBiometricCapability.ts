import { useEffect, useState } from 'react';
import { biometricService } from '@/services/container';
import type { BiometricCapability } from '@/services/BiometricService';

export function useBiometricCapability() {
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  useEffect(() => {
    let active = true;
    biometricService.checkAvailability()
      .then((value) => { if (active) setCapability(value); })
      .catch(() => { if (active) setCheckFailed(true); });
    return () => { active = false; };
  }, []);
  const available = Boolean(capability?.hasHardware && capability.isEnrolled && (capability.supportsFingerprint || capability.supportsFace || capability.supportsIris));
  const message = checkFailed ? 'No pudimos consultar la biometría. Inténtalo desde el botón.' : capability && !available
    ? !capability.hasHardware || !(capability.supportsFingerprint || capability.supportsFace || capability.supportsIris)
      ? 'Este dispositivo no tiene biometría disponible.'
      : 'Configura la biometría en tu dispositivo para continuar.'
    : null;
  return { capability, available, message };
}
