import { useEffect, useRef, useState } from 'react';
import { LightSensor } from 'expo-sensors';
import { AppState, Platform } from 'react-native';
import { createAmbientLightDetector, type AmbientScheme } from '@/utils/ambientLight';

export function useAmbientLightTheme(enabled: boolean): AmbientScheme | null {
  const [scheme, setScheme] = useState<AmbientScheme | null>(null);
  const schemeRef = useRef<AmbientScheme | null>(null);
  const detector = useRef(createAmbientLightDetector());

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;
    let mounted = true;
    let starting = false;
    let restartPending = false;
    let generation = 0;
    let subscription: ReturnType<typeof LightSensor.addListener> | undefined;
    const isForeground = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive';

    const stop = () => {
      generation += 1;
      subscription?.remove();
      subscription = undefined;
      detector.current = createAmbientLightDetector(schemeRef.current);
    };
    const start = async () => {
      if (starting) {
        restartPending = true;
        return;
      }
      if (subscription || !isForeground()) return;
      starting = true;
      const currentGeneration = generation;
      try {
        const available = await LightSensor.isAvailableAsync();
        if (!mounted || !available || !isForeground() || subscription || currentGeneration !== generation) return;
        LightSensor.setUpdateInterval(750);
        subscription = LightSensor.addListener(({ illuminance }) => {
          const next = detector.current.sample(illuminance, Date.now());
          if (next) {
            schemeRef.current = next;
            setScheme(next);
          }
        });
      } catch {
        // System appearance remains the fallback when the sensor is unavailable.
      } finally {
        starting = false;
        if (restartPending) {
          restartPending = false;
          if (mounted && isForeground()) void start();
        }
      }
    };
    if (isForeground()) void start();
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void start();
      else stop();
    });
    return () => {
      mounted = false;
      appState.remove();
      stop();
    };
  }, [enabled]);

  return enabled ? scheme : null;
}
