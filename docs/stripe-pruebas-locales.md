# Probar la suscripción mensual sin Blaze

Este flujo usa Stripe en un entorno de prueba y **Firebase Emulator Suite** en tu computadora. No despliega Cloud Functions ni modifica los usuarios o documentos de la base real. Si quieres usar tus cuentas y Firestore en línea con Spark, sigue [esta guía](stripe-spark-firestore-online.md). En Stripe primero crea un **producto con precio recurrente mensual** desde **Catálogo de productos → Crear producto**; el botón «+ → Suscripción» crea una suscripción para un cliente y no sirve para configurar el precio de la app. Copia el ID del precio `price_...`.

## Requisitos

- Node.js y Java 21 o superior para el emulador de Firestore.
- Tu computadora y el teléfono en la misma red Wi-Fi, o un emulador Android.
- Una cuenta de Stripe en entorno de prueba. Usa una clave de prueba `rk_test_...` con permisos de lectura para Prices y Subscriptions y escritura para Checkout Sessions; también funciona `sk_test_...`. **Nunca** pongas esta clave en `EXPO_PUBLIC_*` ni la compartas por chat.

## Configuración local

1. Averigua la dirección IPv4 de tu computadora con `ipconfig`. En un teléfono usa esa IP (por ejemplo `192.168.1.50`); en un emulador Android usa `10.0.2.2`; en web usa `127.0.0.1`.
2. Añade al `.env` de la app, además de las variables Firebase existentes:

   ```dotenv
   EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=192.168.1.50
   EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED=true
   ```

   Quita `EXPO_PUBLIC_STRIPE_TEST_BACKEND_URL` si venías de la configuración con Firestore en línea.

3. Crea `functions/.env.local` (excluido de Git) con el ID `price_...` del **mismo entorno de prueba** que usarás con la clave:

   ```dotenv
   STRIPE_MONTHLY_PRICE_ID=price_REEMPLAZAR
   STRIPE_RETURN_URL=http://192.168.1.50:5001/asesorut-7bf6e/us-central1/checkoutReturn
   ```

   Sustituye la IP de ambos archivos por la de tu computadora. En el emulador Android, el navegador accede al host mediante `10.0.2.2`. Si Stripe no acepta la URL local de retorno en tu entorno, usa temporalmente una página HTTPS tuya y vuelve manualmente a la app; el retorno jamás activa la suscripción.

4. Instala la CLI de Stripe y vincúlala con tu entorno de prueba. En una terminal, deja corriendo el listener de webhooks:

   ```powershell
   npm install -g @stripe/cli
   stripe login
   stripe listen --events=checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed --forward-to http://127.0.0.1:5001/asesorut-7bf6e/us-central1/stripeWebhook
   ```

   La CLI mostrará un secreto `whsec_...`. Este secreto es **del listener local**, no el de un webhook creado en el Dashboard.

5. Crea `functions/.secret.local` (también excluido de Git) con tu clave de prueba y el `whsec_...` anterior:

   ```dotenv
   STRIPE_SECRET_KEY=rk_test_REEMPLAZAR
   STRIPE_WEBHOOK_SECRET=whsec_REEMPLAZAR
   ```

6. En otra terminal, desde la raíz del proyecto, inicia los tres emuladores:

   ```powershell
   npm --prefix functions install
   $env:FUNCTIONS_DISCOVERY_TIMEOUT = '30'
   npx -y firebase-tools@latest emulators:start --only auth,firestore,functions --project asesorut-7bf6e
   ```

   Su interfaz se abre en `http://127.0.0.1:4000`. Los emuladores escuchan en los puertos 9099, 8080 y 5001. Si Windows pregunta por el firewall, permite el acceso solo en tu red privada para usar un teléfono físico.

7. Reinicia Expo para que lea el `.env`:

   ```powershell
   npx expo start --clear
   ```

   Regístrate otra vez en la app y verifica el correo: Authentication y Firestore locales empiezan vacíos y no contienen tu cuenta de Firebase en línea. En la pantalla de Suscripción pulsa **Suscribirte** y usa una [tarjeta de prueba](https://docs.stripe.com/testing), como `4242 4242 4242 4242`, fecha futura y cualquier CVC. Al volver a la app, espera unos segundos a que Stripe confirme la compra: el estado cambiará automáticamente. El emulador de Firestore debe mostrar `tier: subscribed`, `isActive: true` y `provider: stripe`; la cuarta receta debe abrirse.

En Expo Go, el botón de retorno `recetario://` puede no abrir la app. Vuelve manualmente desde el navegador; una compilación de desarrollo sí registra el esquema. Mantén abiertas la terminal de Stripe CLI, la de emuladores y la de Expo durante la prueba.

Para regresar a la base real, elimina `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` del `.env` y reinicia Expo. Si quieres mantener Stripe de prueba con la base real, sigue [la configuración con Spark](stripe-spark-firestore-online.md); de otro modo, desactiva el botón con `EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED=false`.

Referencias: [emuladores de Firebase](https://firebase.google.com/docs/functions/get-started), [secrets locales](https://firebase.google.com/docs/functions/config-env), [webhooks con Stripe CLI](https://docs.stripe.com/cli/listen) y [productos con precios recurrentes](https://docs.stripe.com/billing/subscriptions/pricing-models).
