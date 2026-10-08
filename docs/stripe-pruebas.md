# Suscripción mensual de prueba con Stripe

Para una demostración **sin activar Blaze**, sigue primero [las pruebas locales](stripe-pruebas-locales.md). Esta página describe el despliegue en Firebase, que sí requiere Blaze.

El proyecto tiene preparado un flujo de **Stripe Checkout en modo de prueba**. La app solicita una sesión de Checkout a una Cloud Function autenticada; Stripe envía sus eventos a otra función, que verifica la firma y actualiza `subscriptions/{uid}`. Volver a la app no concede acceso por sí mismo. Una suscripción mensual activa desbloquea todas las recetas; si caduca o deja de estar activa, vuelven a estar disponibles solo las tres recetas gratuitas del usuario.

No hay claves privadas en la app. El botón de Stripe solo aparece en desarrollo cuando `EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED=true`.

## Preparación

1. Crea una cuenta en [Stripe](https://dashboard.stripe.com/register) y activa **modo de prueba** en el Dashboard.
2. En el catálogo de Stripe crea un producto «Recetario» y un precio **recurrente mensual** de prueba. Guarda su `price_...`. La función rechaza un precio real o que no sea mensual.
3. Activa el plan **Blaze** para el proyecto Firebase `asesorut-7bf6e` antes de desplegar Cloud Functions. Al revisar el proyecto, la facturación estaba deshabilitada. El plan puede generar cargos por infraestructura según el uso aunque Stripe esté en modo de prueba.
4. En PowerShell, desde la raíz del repositorio, crea `functions/.env.asesorut-7bf6e` con estos valores (sin comillas):

   ```dotenv
   STRIPE_MONTHLY_PRICE_ID=price_REEMPLAZAR
   STRIPE_RETURN_URL=https://us-central1-asesorut-7bf6e.cloudfunctions.net/checkoutReturn
   ```

   El archivo está excluido de Git. El `price_...` identifica el precio; **nunca** pongas `sk_test_...` ni `whsec_...` aquí o en un archivo `EXPO_PUBLIC_`.

5. Instala dependencias y registra la clave privada de **prueba** de Stripe en Secret Manager:

   ```powershell
   npm --prefix functions install
   npx -y firebase-tools@latest functions:secrets:set STRIPE_SECRET_KEY --project asesorut-7bf6e
   ```

6. Para poder desplegar el endpoint de webhook, registra primero un valor temporal para su secreto, por ejemplo `pendiente-de-configurar`. Después despliega las funciones:

   ```powershell
   npx -y firebase-tools@latest functions:secrets:set STRIPE_WEBHOOK_SECRET --project asesorut-7bf6e
   npx -y firebase-tools@latest deploy --only functions --project asesorut-7bf6e
   ```

7. En Stripe, crea un webhook **de prueba** con destino `https://us-central1-asesorut-7bf6e.cloudfunctions.net/stripeWebhook`. Selecciona los eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`. Copia el secreto de firma `whsec_...` del endpoint, reemplaza con él el valor temporal y despliega otra vez:

   ```powershell
   npx -y firebase-tools@latest functions:secrets:set STRIPE_WEBHOOK_SECRET --project asesorut-7bf6e
   npx -y firebase-tools@latest deploy --only functions --project asesorut-7bf6e
   ```

8. En el `.env` de la app, añade `EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED=true` y reinicia Metro. Inicia sesión en la app, abre **Suscripción** y pulsa **Suscribirte**. Usa una [tarjeta de prueba de Stripe](https://docs.stripe.com/testing), por ejemplo `4242 4242 4242 4242`, una fecha futura y cualquier CVC. No se cobrará dinero real. Al volver, la pantalla actualizará el estado automáticamente cuando llegue el webhook. Comprueba que `subscriptions/{uid}` tenga `tier: subscribed`, `isActive: true`, `provider: stripe` y `expiresAt` futuro.

En Expo Go, el enlace «Volver a Recetario» de la página final puede no reconocer el esquema `recetario://`. Puedes volver manualmente y actualizar el estado. Para probar ese enlace directamente, usa una compilación de desarrollo con el esquema del `app.json`.

## Seguridad y publicación

- Las reglas actuales de Firestore del proyecto permiten al cliente leer su suscripción y crear el documento inicial `free`, pero no actualizarlo ni borrarlo. Mantén esa restricción al cambiar las reglas.
- Las funciones aceptan solo claves y eventos de Stripe en modo de prueba. El webhook verifica `stripe-signature` con el cuerpo original antes de escribir en Firestore.
- Este flujo es para la demostración escolar. **No actives el botón de Stripe en una versión distribuida por Google Play** para desbloquear contenido digital: antes de publicar esa versión hay que revisar e implementar el sistema de facturación requerido por la [política de Google Play](https://support.google.com/googleplay/android-developer/answer/9858738?hl=es), salvo que aplique una excepción concreta.
- La cancelación se puede probar desde el Dashboard de Stripe. El acceso se actualiza por webhook; el cliente solo consulta Firestore.

Referencias: [Checkout de suscripción](https://docs.stripe.com/billing/subscriptions/build-subscriptions?payment-ui=stripe-hosted), [webhooks de Stripe](https://docs.stripe.com/webhooks), [Secret Manager de Firebase Functions](https://firebase.google.com/docs/functions/config-env) y [enlaces de Expo](https://docs.expo.dev/versions/v57.0.0/sdk/linking/).
