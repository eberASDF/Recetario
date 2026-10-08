import * as Linking from 'expo-linking';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/firebase/config';
import { auth } from '@/firebase/auth';
import { connectEmulatorOnce, emulatorHost } from '@/firebase/emulator';

const functions = getFunctions(firebaseApp, 'us-central1');
const localHost = emulatorHost;
if (localHost) connectEmulatorOnce('functions', () => connectFunctionsEmulator(functions, localHost, 5001));
const createStripeCheckout = httpsCallable<void, { url: string }>(
  functions,
  'createStripeCheckout',
);

export const stripeTestCheckoutEnabled = __DEV__ && process.env.EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED === 'true';

async function checkoutUrlFromLocalBackend(baseUrl: string): Promise<string> {
  const endpoint = new URL(baseUrl);
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/' ||
      (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' &&
        /^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(endpoint.hostname)))) {
    throw new Error('La dirección del servidor Stripe no es válida.');
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Inicia sesión para suscribirte.');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let response: Response;
    try {
      response = await fetch(new URL('/checkout', endpoint).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) {
        throw new Error('El servidor Stripe tardó más de 15 segundos. Revisa su ventana para ver el error.');
      }
      throw new Error(`No se pudo conectar con Stripe en ${endpoint.origin}. Abre /health en el navegador del teléfono y revisa la IP y el servidor.`);
    }
    if (!response.ok) {
      if (response.status === 401) throw new Error('La sesión de Firebase no fue aceptada por el servidor. Cierra sesión y vuelve a entrar.');
      if (response.status === 409) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? 'La suscripción ya existe o falta su registro en Firestore.');
      }
      throw new Error(`El servidor no pudo crear el pago (${response.status}). Revisa la ventana del servidor Stripe.`);
    }
    const data = await response.json() as { url?: string };
    return data.url ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

export async function openStripeTestCheckout(): Promise<void> {
  if (!stripeTestCheckoutEnabled) throw new Error('El pago de prueba no está configurado.');
  const backendUrl = process.env.EXPO_PUBLIC_STRIPE_TEST_BACKEND_URL?.trim();
  const url = backendUrl
    ? await checkoutUrlFromLocalBackend(backendUrl)
    : (await createStripeCheckout()).data?.url;
  if (!url || !/^https:\/\/checkout\.stripe\.com\//.test(url)) {
    throw new Error('Stripe devolvió un enlace de pago inválido.');
  }
  await Linking.openURL(url);
}
