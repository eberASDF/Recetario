import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  // Firebase 13 exposes this on React Native at runtime, but its shared types omit it.
  export function getReactNativePersistence(
    storage: Pick<typeof import('@react-native-async-storage/async-storage').default, 'getItem' | 'setItem' | 'removeItem'>,
  ): Persistence;
}
