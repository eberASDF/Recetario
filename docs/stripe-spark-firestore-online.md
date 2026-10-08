# Stripe de prueba con Firestore en línea y plan Spark

Esta configuración usa las cuentas existentes en Firebase Authentication y la base Cloud Firestore `(default)` del proyecto `asesorut-7bf6e`. Un servidor Node.js en tu computadora crea Checkout, verifica el token de Firebase y procesa los webhooks firmados de Stripe. **No inicia los emuladores ni requiere Blaze.** Para una demostración, la computadora, Stripe CLI y Expo deben permanecer encendidos. No es un servidor publicado ni estará disponible de manera permanente.

## Preparación única

1. En la consola de Firebase, abre **Configuración del proyecto → Cuentas de servicio → Firebase Admin SDK → Generar nueva clave privada**. Guarda el JSON fuera de esta carpeta, en un lugar privado. Es una credencial de administrador que puede saltarse las reglas de Firestore: no la pongas en la app ni en Git. Si otra persona ejecutará el servidor, deberá generar su propia clave con acceso al proyecto o recibirla por un canal privado. El servidor comprobará que el JSON corresponda a `asesorut-7bf6e`.
2. En `.env` de la raíz, mantén los datos Firebase del proyecto y estas líneas. Usa la IPv4 actual de tu PC, visible con `ipconfig`:

   ```dotenv
   EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED=true
   EXPO_PUBLIC_STRIPE_TEST_BACKEND_URL=http://192.168.1.50:4242
   ```

   **Elimina** `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` si aparece. La app volverá a Firebase en línea al reiniciar Expo. No pongas claves privadas en ninguna variable `EXPO_PUBLIC_*`.
3. En `functions/.env.local` (ignorado por Git), configura:

   ```dotenv
   FIREBASE_PROJECT_ID=asesorut-7bf6e
   STRIPE_MONTHLY_PRICE_ID=price_REEMPLAZAR
   STRIPE_RETURN_URL=http://192.168.1.50:4242/return
   ```

   Usa el `price_...` mensual del entorno de prueba y la **misma IP** que en `.env`.
4. En `functions/.secret.local` (ignorado por Git), conserva `STRIPE_SECRET_KEY=sk_test_...` o `rk_test_...` y `STRIPE_WEBHOOK_SECRET=whsec_...`. Deben ser del mismo entorno de prueba. Una clave restringida debe poder leer Prices y Subscriptions, crear Checkout Sessions y consultar las suscripciones para procesar los eventos.

## Cada vez que hagas una prueba

Abre tres ventanas de **CMD** en la carpeta raíz del proyecto:

**Ventana 1: Stripe CLI.** Instala la CLI e inicia sesión si aún no lo hiciste. Después escucha los eventos:

```cmd
stripe listen --events=checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed --forward-to http://127.0.0.1:4242/webhook
```

Compara el `whsec_...` mostrado con `STRIPE_WEBHOOK_SECRET` de `functions/.secret.local`. Si cambió, actualiza ese archivo y reinicia el servidor. No uses el secreto de un endpoint del Dashboard para este listener local.

**Ventana 2: servidor Stripe.** Sustituye la ruta por la ubicación real del JSON privado:

```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\privada\asesorut-service-account.json
npm --prefix functions install
npm --prefix functions run serve:local
```

Debe mostrar que Stripe de prueba está conectado a Firebase `asesorut-7bf6e` en el puerto 4242. Puedes abrir `http://127.0.0.1:4242/health` en el navegador de la PC. Si Windows pregunta por el firewall, permite el puerto 4242 solo en la red privada para que el teléfono pueda acceder. El JSON no se copia a `functions/`.

**Ventana 3: Expo.** La PC y el teléfono deben estar en la misma Wi-Fi:

```cmd
npx expo start --clear --lan
```

Escanea el QR con Expo Go. Inicia sesión con una **cuenta existente en Firebase en línea**, entra a Suscripción y pulsa **Probar suscripción mensual con Stripe**. Usa una [tarjeta de prueba de Stripe](https://docs.stripe.com/testing). Al regresar a la app, el cambio en `subscriptions/{uid}` debería aparecer automáticamente; comprueba en la consola de Firestore que diga `tier: subscribed`, `isActive: true` y `provider: stripe`. La cuarta receta debe abrirse. En Expo Go, si el enlace `recetario://` no abre la app, vuelve manualmente.

Si el botón tarda demasiado o muestra un error de conexión, ejecuta `ipconfig` de nuevo: la IPv4 puede cambiar al reconectar la Wi-Fi. Actualiza esa IP tanto en `.env` como en `functions/.env.local`, reinicia el servidor y Expo, y abre `http://IP-ACTUAL:4242/health` **en el navegador del teléfono**. Si no carga, revisa que el teléfono esté en la misma Wi-Fi y que el firewall de Windows permita el puerto 4242 en la red privada. Si `/health` sí carga pero Checkout falla, revisa el error en la ventana del servidor y la de Stripe CLI; nunca copies aquí la clave JSON, `sk_test_...` ni `whsec_...`.

## Alcance y seguridad

- El cliente envía su token de Firebase al servidor. El servidor verifica el token antes de crear Checkout; solo el webhook firmado de Stripe actualiza la suscripción. Las reglas publicadas de Firestore impiden que el cliente edite su propio acceso de pago.
- No inicies `firebase emulators:start` para esta configuración. No hace falta instalar ni desplegar Cloud Functions.
- Si apagas el servidor o Stripe CLI, los eventos de pago, renovación o cancelación no se procesarán hasta volver a establecer un receptor. Para una app disponible en todo momento necesitarás alojar este backend fuera de Firebase o usar Functions con Blaze. El alojamiento externo tiene sus propias condiciones y posibles costos.
- Este flujo es **solo para pruebas escolares**. Antes de distribuir una app con suscripciones para contenido digital en Google Play, revisa la [política de pagos de Google Play](https://support.google.com/googleplay/android-developer/answer/9858738?hl=es) y usa el sistema de facturación que corresponda.
