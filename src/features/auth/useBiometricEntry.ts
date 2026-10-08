import { useRef, useState } from 'react';
import type { BiometricOutcome } from '@/services/BiometricService';
import { useEntry } from './EntryContext';

const feedback: Record<Exclude<BiometricOutcome, 'success'>, string> = {
  unavailable: 'Este dispositivo no tiene biometría disponible.',
  not_enrolled: 'Configura la biometría en tu dispositivo para continuar.',
  cancelled: 'Verificación cancelada. Puedes intentarlo de nuevo.',
  failed: 'No pudimos confirmar tu identidad. Vuelve a intentarlo.',
  locked: 'La biometría está bloqueada temporalmente. Inténtalo más tarde.',
  error: 'No pudimos iniciar la verificación. Inténtalo otra vez.',
};

export function useBiometricEntry() {
  const { unlockWithBiometrics } = useEntry();
  const pending = useRef(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const verify = async () => {
    if (pending.current) return;
    pending.current = true;
    setWorking(true);
    setMessage(null);
    try {
      const outcome = await unlockWithBiometrics();
      if (outcome !== 'success') setMessage(feedback[outcome]);
    } catch {
      setMessage(feedback.error);
    } finally {
      pending.current = false;
      setWorking(false);
    }
  };

  return { verify, working, message };
}
