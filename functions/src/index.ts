import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { createCheckoutSession, processStripeEvent, testStripe } from './stripeCore';

initializeApp();

const stripeKey = defineSecret('STRIPE_SECRET_KEY');
const webhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const monthlyPriceId = defineString('STRIPE_MONTHLY_PRICE_ID');
const returnUrl = defineString('STRIPE_RETURN_URL');
const region = 'us-central1';

function checkoutReturnUrl(): string {
  const url = new URL(returnUrl.value());
  const localHttp = process.env.FUNCTIONS_EMULATOR === 'true' && url.protocol === 'http:' &&
    /^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(url.hostname);
  if (url.protocol !== 'https:' && !localHttp) throw new Error('STRIPE_RETURN_URL debe usar HTTPS o una dirección local del emulador.');
  return url.toString();
}

export const createStripeCheckout = onCall(
  { region, secrets: [stripeKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión para suscribirte.');
    const email = request.auth?.token.email;

    try {
      const url = await createCheckoutSession(
        testStripe(stripeKey.value()), getFirestore(), uid, email, monthlyPriceId.value(), checkoutReturnUrl(),
      );
      return { url };
    } catch (error) {
      if (error instanceof Error && error.message === 'Falta el registro de suscripción.') {
        throw new HttpsError('failed-precondition', error.message);
      }
      if (error instanceof Error && error.message === 'Ya tienes una suscripción activa.') {
        throw new HttpsError('already-exists', error.message);
      }
      console.error('No se pudo iniciar Checkout', error);
      throw new HttpsError('internal', 'No se pudo iniciar el pago de prueba.');
    }
  },
);

export const stripeWebhook = onRequest(
  { region, secrets: [stripeKey, webhookSecret] },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method not allowed');
      return;
    }
    const signature = request.header('stripe-signature');
    if (!signature) {
      response.status(400).send('Missing signature');
      return;
    }

    let event: Stripe.Event;
    let stripe: Stripe;
    try {
      stripe = testStripe(stripeKey.value());
      event = stripe.webhooks.constructEvent(request.rawBody, signature, webhookSecret.value());
    } catch (error) {
      console.error('Firma de Stripe inválida', error);
      response.status(400).send('Invalid signature');
      return;
    }
    if (event.livemode) {
      response.status(400).send('Live events are disabled');
      return;
    }

    try {
      await processStripeEvent(stripe, getFirestore(), monthlyPriceId.value(), event);
      response.status(200).send('ok');
    } catch (error) {
      console.error('No se pudo sincronizar la suscripción', error);
      response.status(500).send('Retry later');
    }
  },
);

export const checkoutReturn = onRequest({ region }, (request, response) => {
  const completed = request.query.status === 'success';
  response.set('Cache-Control', 'no-store');
  response.status(200).type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Recetario · Stripe de prueba</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:12vh auto;padding:1.5rem;line-height:1.5">
<h1>${completed ? 'Pago de prueba recibido' : 'Pago de prueba cancelado'}</h1>
<p>${completed ? 'Vuelve a Recetario. El acceso se actualizará automáticamente cuando Stripe confirme la suscripción.' : 'Puedes volver a Recetario cuando quieras.'}</p>
<a href="recetario://suscripcion" style="display:inline-block;padding:1rem 1.5rem;background:#254d38;color:white;border-radius:2rem;text-decoration:none">Volver a Recetario</a>
</body></html>`);
});
