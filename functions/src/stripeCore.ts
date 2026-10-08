import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

export function testStripe(key: string): Stripe {
  if (!key || (!key.startsWith('sk_test_') && !key.startsWith('rk_test_'))) {
    throw new Error('Stripe debe estar en modo de prueba.');
  }
  return new Stripe(key);
}

export async function createCheckoutSession(
  stripe: Stripe,
  db: Firestore,
  uid: string,
  email: string | undefined,
  priceId: string,
  returnUrl: string,
  onStep?: (step: string) => void,
): Promise<string> {
  onStep?.('Leyendo la suscripción en Firestore');
  const current = await db.doc(`subscriptions/${uid}`).get();
  if (!current.exists) throw new Error('Falta el registro de suscripción.');
  const expiration = current.get('expiresAt');
  if (current.get('tier') === 'subscribed' && current.get('isActive') === true &&
      (expiration === null || (expiration instanceof Timestamp && expiration.toMillis() > Date.now()))) {
    throw new Error('Ya tienes una suscripción activa.');
  }

  onStep?.('Consultando el precio en Stripe');
  const price = await stripe.prices.retrieve(priceId);
  if (price.livemode || !price.active || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) {
    throw new Error('El precio configurado debe ser mensual y de prueba.');
  }

  const successUrl = new URL(returnUrl);
  successUrl.searchParams.set('status', 'success');
  const cancelUrl = new URL(returnUrl);
  cancelUrl.searchParams.set('status', 'cancel');
  onStep?.('Creando la sesión de Checkout');
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: uid,
    ...(email ? { customer_email: email } : {}),
    subscription_data: { metadata: { firebaseUid: uid } },
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
  });
  onStep?.('Checkout creado');
  if (!session.url) throw new Error('Stripe no devolvió la página de cobro.');
  return session.url;
}

async function syncSubscription(stripe: Stripe, db: Firestore, priceId: string, subscriptionId: string): Promise<void> {
  // Consultar el estado actual evita que eventos entregados fuera de orden revivan una suscripción.
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.livemode) throw new Error('No se aceptan eventos de pagos reales.');
  const uid = subscription.metadata.firebaseUid;
  if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('La suscripción no tiene un UID válido.');

  const item = subscription.items.data.find((candidate) => candidate.price.id === priceId);
  if (!item) throw new Error('La suscripción no corresponde al precio configurado.');

  const ref = db.doc(`subscriptions/${uid}`);
  const current = await ref.get();
  if (!current.exists) throw new Error('No existe la cuenta asociada a la suscripción.');
  const existingId = current.get('stripeSubscriptionId');
  if (existingId && existingId !== subscription.id && current.get('isActive') === true) return;

  const periodEnd = item.current_period_end;
  const active = subscription.status === 'active' && !!periodEnd && periodEnd * 1000 > Date.now();
  await ref.set({
    tier: active ? 'subscribed' : 'free',
    isActive: active,
    expiresAt: active ? Timestamp.fromMillis(periodEnd * 1000) : null,
    provider: 'stripe',
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function processStripeEvent(stripe: Stripe, db: Firestore, priceId: string, event: Stripe.Event): Promise<void> {
  if (event.livemode) throw new Error('No se aceptan eventos de pagos reales.');
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === 'subscription' && typeof session.subscription === 'string') {
      await syncSubscription(stripe, db, priceId, session.subscription);
    }
  } else if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await syncSubscription(stripe, db, priceId, (event.data.object as Stripe.Subscription).id);
  } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.parent?.subscription_details?.subscription;
    if (typeof subscriptionId === 'string') await syncSubscription(stripe, db, priceId, subscriptionId);
  }
}
