import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { AppState } from 'react-native';
import { createShakeDetector } from '@/utils/shakeDetection';

export function useShakeDetection(enabled: boolean, onShake: () => void): void {
  const callback = useRef(onShake);
  useEffect(() => { callback.current = onShake; }, [onShake]);

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    let active = true;
    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    let detector = createShakeDetector();

    const stop = () => {
      subscription?.remove();
      subscription = undefined;
      detector = createShakeDetector();
    };
    const start = async () => {
      if (subscription) return;
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!active || AppState.currentState === 'background' || AppState.currentState === 'inactive' || !available || subscription) return;
        Accelerometer.setUpdateInterval(80);
        subscription = Accelerometer.addListener((sample) => {
          if (detector.sample(sample, Date.now())) callback.current();
        });
      } catch {
        // An unavailable sensor leaves discovery inactive on this device.
      }
    };
    if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') void start();
    const appStateSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void start();
      else stop();
    });
    return () => {
      active = false;
      appStateSubscription.remove();
      stop();
    };
  }, [enabled]));
}
