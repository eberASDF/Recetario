// Las tres conexiones deben usar el mismo host para mantener las pruebas aisladas.
export const emulatorHost = __DEV__ && process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
  ? process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST.trim()
  : null;

const registry = globalThis as typeof globalThis & { __recetarioEmulators?: Set<string> };

export function connectEmulatorOnce(key: string, connect: () => void): void {
  const connected = registry.__recetarioEmulators ??= new Set<string>();
  if (connected.has(key)) return;
  connect();
  connected.add(key);
}
