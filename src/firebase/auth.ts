import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { firebaseApp } from './config';
import { connectEmulatorOnce, emulatorHost } from './emulator';

function createAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export const auth = createAuth();
const localHost = emulatorHost;
if (localHost) connectEmulatorOnce('auth', () => connectAuthEmulator(auth, `http://${localHost}:9099`, { disableWarnings: true }));
