import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createCheckoutSession, processStripeEvent, testStripe } from './stripeCore';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta ${name}.`);
  return value;
}

if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Este servidor debe usar Firebase en línea. Quita las variables de emuladores.');
}

const projectId = required('FIREBASE_PROJECT_ID');
const credentialPath = required('GOOGLE_APPLICATION_CREDENTIALS');
const credentialInfo = JSON.parse(readFileSync(credentialPath, 'utf8')) as { project_id?: string };
if (credentialInfo.project_id !== projectId) {
  throw new Error('La cuenta de servicio no corresponde al proyecto Firebase configurado.');
}
const priceId = required('STRIPE_MONTHLY_PRICE_ID');
if (!priceId.startsWith('price_')) throw new Error('STRIPE_MONTHLY_PRICE_ID no es válido.');
const webhookSecret = required('STRIPE_WEBHOOK_SECRET');
if (!webhookSecret.startsWith('whsec_')) throw new Error('STRIPE_WEBHOOK_SECRET no es válido.');
const stripe = testStripe(required('STRIPE_SECRET_KEY'));
const returnUrl = new URL(required('STRIPE_RETURN_URL'));
if (returnUrl.protocol !== 'http:' || returnUrl.pathname !== '/return' || !/^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(returnUrl.hostname)) {
  throw new Error('STRIPE_RETURN_URL debe ser http://IP-LOCAL:4242/return.');
}
const port = 4242;
if (returnUrl.port !== String(port)) throw new Error('STRIPE_RETURN_URL debe usar el puerto 4242.');

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

function send(response: ServerResponse, status: number, body: object): void {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > limit) throw new Error('Cuerpo demasiado grande.');
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (request.method === 'GET' && url.pathname === '/health') {
    send(response, 200, { ok: true, projectId, mode: 'stripe-test-firestore-online' });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/return') {
    const completed = url.searchParams.get('status') === 'success';
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Recetario · Stripe de prueba</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:12vh auto;padding:1.5rem;line-height:1.5"><h1>${completed ? 'Pago de prueba recibido' : 'Pago de prueba cancelado'}</h1><p>${completed ? 'Vuelve a Recetario. El acceso se actualizará cuando Stripe confirme la suscripción.' : 'Puedes volver a Recetario cuando quieras.'}</p><a href="recetario://suscripcion" style="display:inline-block;padding:1rem 1.5rem;background:#254d38;color:white;border-radius:2rem;text-decoration:none">Volver a Recetario</a></body></html>`);
    return;
  }
  if (request.method === 'POST' && url.pathname === '/checkout') {
    const requestId = randomUUID().slice(0, 8);
    const startedAt = Date.now();
    const logStep = (step: string) => console.log(`[checkout ${requestId} +${Date.now() - startedAt}ms] ${step}`);
    logStep('Solicitud recibida');
    const bearer = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '');
    if (!bearer) {
      send(response, 401, { error: 'Inicia sesión para suscribirte.' });
      return;
    }
    let user;
    try {
      logStep('Verificando sesión de Firebase');
      user = await getAuth().verifyIdToken(bearer[1]);
      logStep('Sesión de Firebase verificada');
    } catch {
      logStep('Sesión de Firebase rechazada');
      send(response, 401, { error: 'Sesión de Firebase inválida.' });
      return;
    }
    try {
      const checkoutUrl = await createCheckoutSession(stripe, db, user.uid, user.email, priceId, returnUrl.toString(), logStep);
      send(response, 200, { url: checkoutUrl });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Falta el registro de suscripción.' || error.message === 'Ya tienes una suscripción activa.')) {
        send(response, 409, { error: error.message });
      } else {
        console.error('No se pudo iniciar Checkout', error);
        send(response, 500, { error: 'No se pudo iniciar el pago de prueba.' });
      }
    }
    return;
  }
  if (request.method === 'POST' && url.pathname === '/webhook') {
    const signature = request.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      send(response, 400, { error: 'Falta la firma de Stripe.' });
      return;
    }
    try {
      const rawBody = await readBody(request, 1024 * 1024);
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      await processStripeEvent(stripe, db, priceId, event);
      send(response, 200, { ok: true });
    } catch (error) {
      console.error('Webhook de Stripe rechazado', error);
      send(response, 400, { error: 'Webhook inválido o no procesado.' });
    }
    return;
  }
  send(response, 404, { error: 'Ruta no encontrada.' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Stripe de prueba conectado a Firebase ${projectId} en el puerto ${port}.`);
});
