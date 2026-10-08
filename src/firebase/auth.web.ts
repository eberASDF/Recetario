import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { firebaseApp } from './config';
import { connectEmulatorOnce, emulatorHost } from './emulator';

export const auth = getAuth(firebaseApp);
const localHost = emulatorHost;
if (localHost) connectEmulatorOnce('auth', () => connectAuthEmulator(auth, `http://${localHost}:9099`, { disableWarnings: true }));
