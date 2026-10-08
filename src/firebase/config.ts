import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectEmulatorOnce, emulatorHost } from './emulator';

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta configurar ${name} en el entorno de Expo.`);
  return value;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: requiredEnv('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: requiredEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: requiredEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: requiredEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requiredEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: requiredEnv('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

export const firebaseApp = emulatorHost
  ? (getApps().find((app) => app.name === 'recetario-emulator') ?? initializeApp(firebaseConfig, 'recetario-emulator'))
  : (getApps().find((app) => app.name === '[DEFAULT]') ?? initializeApp(firebaseConfig));
export const db = getFirestore(firebaseApp);
const localHost = emulatorHost;
if (localHost) connectEmulatorOnce('firestore', () => connectFirestoreEmulator(db, localHost, 8080));
