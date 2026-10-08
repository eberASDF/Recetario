# Entrega del recetario al siguiente desarrollador

Esta guía es para **Windows CMD** y un teléfono con **Expo Go**. La app usa Firebase Authentication y Cloud Firestore **en línea** del proyecto `asesorut-7bf6e` (plan Spark). Stripe funciona en **modo de prueba** mediante un servidor Node.js local en el puerto `4242` y Stripe CLI. No hace falta ejecutar emuladores de Firebase ni activar Blaze para esta demostración.

## 1. Archivos y accesos que debe recibir

- El proyecto completo, incluidos `package.json`, `package-lock.json`, la carpeta `functions/` y su `package-lock.json`.
- El archivo `.env` de la raíz, `functions/.env.local` y `functions/.secret.local`. Son archivos ignorados por Git: si la entrega se hace mediante GitHub, habrá que proporcionarlos por separado y no publicarlos en el repositorio. Si la entrega se hace con una copia de la carpeta, verifica que estén incluidos.
- Una **clave JSON de Firebase Admin SDK** correspondiente a `asesorut-7bf6e`. Quien vaya a ejecutar el servidor puede generar una clave propia si tiene acceso a **Configuración del proyecto → Cuentas de servicio**, o recibir una clave por un canal privado. Guárdala fuera de la carpeta del proyecto. Es una credencial de administrador; no debe incluirse en la app ni en un repositorio público.
- Acceso al **mismo entorno de prueba de Stripe** donde se creó el precio mensual configurado. Cada computadora debe hacer `stripe login` en esa cuenta. Es preferible dar acceso a la persona en Stripe en vez de compartir la contraseña.

No es necesario transferir `node_modules/`, `functions/node_modules/` ni `.expo/`: se regeneran. **Nunca** pongas el JSON, `sk_test_...`, `rk_test_...` ni `whsec_...` en variables `EXPO_PUBLIC_*`.

## 2. Instalación inicial en la computadora nueva

Instala **Node.js 22.13 o posterior** y Expo Go en el teléfono. Abre CMD en la raíz del proyecto y ejecuta:

```cmd
node -v
npm ci
npm --prefix functions ci
npm install -g @stripe/cli
stripe login
ipconfig
```

`stripe login` abrirá la autenticación de Stripe. `ipconfig` muestra la **Dirección IPv4** de la computadora conectada a la Wi-Fi. El teléfono debe usar la misma red.

## 3. Ajustar la IP y las variables locales

Abre `.env` de la raíz. Conserva las seis variables `EXPO_PUBLIC_FIREBASE_*` que identifican `asesorut-7bf6e`. Comprueba que existan estas dos líneas y sustituye `192.168.1.50` por la **IPv4 de la computadora nueva**:

```dotenv
EXPO_PUBLIC_STRIPE_TEST_CHECKOUT_ENABLED=true
EXPO_PUBLIC_STRIPE_TEST_BACKEND_URL=http://192.168.1.50:4242
```

**No debe haber** una línea activa `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST`, porque queremos Auth y Firestore en línea.

Abre `functions/.env.local` y conserva el ID de precio mensual de Stripe. Actualiza la misma IP:

```dotenv
FIREBASE_PROJECT_ID=asesorut-7bf6e
STRIPE_MONTHLY_PRICE_ID=price_TU_PRECIO_MENSUAL_DE_PRUEBA
STRIPE_RETURN_URL=http://192.168.1.50:4242/return
```

Comprueba que `functions/.secret.local` tenga `STRIPE_SECRET_KEY=sk_test_...` o `rk_test_...` del mismo entorno de prueba. La otra variable, `STRIPE_WEBHOOK_SECRET=whsec_...`, se comprobará en el siguiente paso. No publiques este archivo.

## 4. Iniciar los tres procesos

Abre **tres ventanas de CMD**, todas en la raíz del proyecto. Mantén las tres abiertas durante la prueba.

### Ventana 1: eventos de Stripe

```cmd
stripe listen --events=checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed --forward-to http://127.0.0.1:4242/webhook
```

Stripe CLI mostrará un secreto `whsec_...`. Debe coincidir con `STRIPE_WEBHOOK_SECRET` de `functions/.secret.local`. Si no coincide, **actualiza el archivo con el nuevo secreto** antes de iniciar o reiniciar el servidor. Este secreto es del listener local de esa computadora; no uses el secreto de un endpoint del Dashboard.

### Ventana 2: servidor de pagos

Sustituye la ruta del ejemplo por la **ruta completa** del JSON de Firebase Admin SDK en esa computadora:

```cmd
set "GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\privada\clave-firebase-admin.json"
dir "%GOOGLE_APPLICATION_CREDENTIALS%"
npm --prefix functions run serve:local
```

`dir` debe encontrar el JSON. El servidor debe mostrar `Stripe de prueba conectado a Firebase asesorut-7bf6e en el puerto 4242.` La variable `GOOGLE_APPLICATION_CREDENTIALS` solo existe en esa ventana de CMD; si abres una nueva, vuelve a ejecutar `set`.

Si Windows pregunta por el firewall, permite el acceso al puerto `4242` **solo en la red privada**.

### Ventana 3: aplicación móvil

```cmd
npx expo start --clear --lan
```

Escanea el QR con Expo Go. Si cambia la IP de la computadora en otro momento, repite el paso 3 y reinicia el servidor y Expo.

## 5. Verificar que todo funciona

1. En el **navegador del teléfono**, abre `http://IP-DE-ESA-PC:4242/health`. Debe aparecer `"ok":true`. Si no abre, revisa IP, Wi-Fi y firewall antes de intentar pagar.
2. En la app, inicia sesión con una cuenta existente de Firebase en línea o registra una nueva. En Firestore deben verse `users/{uid}`, `userPreferences/{uid}` y `subscriptions/{uid}`.
3. En **Suscripción**, pulsa **Probar suscripción mensual con Stripe**. Checkout debe abrir en el navegador. Usa solo una [tarjeta de prueba de Stripe](https://docs.stripe.com/testing), por ejemplo `4242 4242 4242 4242`, fecha futura y cualquier CVC de tres dígitos. No se mueve dinero real.
4. Al terminar, vuelve a la app. Debe decir **Suscripción activa** y permitir abrir una cuarta receta. En Firestore, `subscriptions/{uid}` debe tener `tier: "subscribed"`, `isActive: true` y `provider: "stripe"`.

Si Checkout abre pero la suscripción no cambia, revisa que Stripe CLI siga abierto, que haya recibido los eventos con respuesta `200`, que el `whsec_...` coincida y que la ventana del servidor no muestre errores. Si el botón tarda más de 15 segundos, la ventana del servidor muestra el último paso alcanzado sin registrar tokens ni claves.

## Si cambias de Wi-Fi o de red

1. Conecta **la PC y el teléfono a la misma red**. En CMD de la PC ejecuta `ipconfig` y anota la nueva **Dirección IPv4** del adaptador que estás usando. No reutilices la IP de la red anterior.
2. En `.env`, cambia `EXPO_PUBLIC_STRIPE_TEST_BACKEND_URL` a `http://NUEVA-IP:4242`.
3. En `functions/.env.local`, cambia `STRIPE_RETURN_URL` a `http://NUEVA-IP:4242/return`. La IP de ambos archivos debe ser idéntica. Las variables Firebase, `price_...`, `sk_test_...` y `whsec_...` no cambian solo por cambiar de red.
4. Detén y reinicia el servidor (`Ctrl+C` y `npm --prefix functions run serve:local`) y Expo (`Ctrl+C` y `npx expo start --clear --lan`). Si abriste una ventana nueva para el servidor, vuelve a configurar `GOOGLE_APPLICATION_CREDENTIALS` con `set "GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\real\clave.json"`. El listener de Stripe CLI puede seguir abierto si aún apunta a `http://127.0.0.1:4242/webhook`.
5. En el navegador del **teléfono**, abre `http://NUEVA-IP:4242/health`. Debe mostrar `"ok":true`. Si no carga, comprueba que el servidor siga abierto, que el firewall de Windows permita el puerto 4242 en esa red privada y que la red no aísle los dispositivos entre sí. Algunas redes de invitados o públicas impiden que el teléfono llegue a la PC.

Firebase y Stripe siguen en línea aunque cambies de Wi-Fi; este ajuste solo afecta las direcciones locales entre el teléfono, el servidor y la página de retorno.

## Límite de esta demostración

El backend de Stripe corre en la computadora de quien hace la prueba. Si esa computadora o Stripe CLI se apagan, no se procesarán los webhooks hasta que exista un receptor disponible. Para una app disponible permanentemente hay que alojar el backend o usar otra arquitectura. Antes de distribuir una suscripción para contenido digital en Google Play, revisa la [política de pagos de Google Play](https://support.google.com/googleplay/android-developer/answer/9858738?hl=es).
