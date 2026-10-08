import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { subscriptionService } from '@/services/container';
import type { AccessState } from '@/types';

export function useAccessState() {
  const [state, setState] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    subscriptionService.getState()
      .then((value) => { if (active) setState(value); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return { state, loading, error };
}
