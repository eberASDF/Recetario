# Recetario

Frontend móvil de recetas con Expo SDK 57, React Native, Expo Router y TypeScript. La interfaz usa una composición editorial sin tarjetas, con Inicio, Buscar, Descubrir y Guardadas.

El sistema de diseño conserva sus tokens claros y añade una paleta oscura suave. En Android, el sensor de luz ambiente puede cambiar el tema tras una lectura estable; cuando no está disponible se usa el tema del sistema. El modo manual está preparado internamente, sin una nueva pantalla de ajustes.

## Ejecutar

```bash
npm install
npx expo start
```

El proyecto usa `package-lock.json` (no Bun). Para probar los módulos nativos en un dispositivo o emulador, crea una compilación de desarrollo con `npx expo run:android` o `npx expo run:ios` en una plataforma compatible, o usa EAS. No se han creado directorios nativos a mano.

```bash
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo export --platform android --output-dir dist
```

## Estructura

| Ruta | Responsabilidad |
| --- | --- |
| `app/` | Entrada, rutas de bienvenida/login/registro/biometría y cuatro pestañas; Perfil, Suscripción y detalle fuera de la barra. |
| `src/components/` | Controles, estados y superficies compartidos. |
| `src/features/` | Flujo de entrada, Inicio, búsqueda, descubrimiento aleatorio, guardadas, recetas, perfil y suscripción. |
| `src/hooks/` | Carga, búsqueda, estado de acceso, sacudidas y sensor de luz ambiente. |
| `src/services/` | Reglas de acceso, servicios y composición de dependencias. |
| `src/repositories/` | Contratos, fuentes externas, adaptadores y persistencia temporal. |
| `src/theme/` | Tokens claros y oscuros, proveedor de tema, tipografía, espacio, radios, iconos y movimiento. |
| `src/types/` y `src/utils/` | Modelo común `Recipe` y utilidades. |
| `src/assets/` | Recursos gráficos; fuentes y sonidos reservados para fases futuras. |

La UI consume `Recipe` a través de `RecipeService`; nunca llama directamente a una API. `TheMealDbSource` y `SpoonacularSource` transforman las respuestas externas al mismo modelo. Sus transportes y credenciales deben conectarse más adelante desde una infraestructura segura. En particular, una clave privada de Spoonacular no debe distribuirse en el bundle público.

Para que el diseño pueda revisarse sin conexión ni claves, **solo en desarrollo** se muestra una captura local de siete respuestas reales de TheMealDB en `src/repositories/fixtures/themealdb.sample.json`. No es un catálogo inventado ni una fuente de producción. Sin una fuente externa configurada, una compilación de producción presenta el estado de error diseñado; la integración en vivo queda pendiente.

## Acceso y sesión

Registro e inicio de sesión usan Firebase Authentication con correo y contraseña.
Al registrarse se crean en un lote los documentos `users/{uid}`,
`subscriptions/{uid}` y `userPreferences/{uid}` con sus valores iniciales. La
sesión persistida la administra Firebase Auth en AsyncStorage; el proveedor de
entrada escucha `onAuthStateChanged` y carga el perfil desde `users/{uid}`. La
contraseña no se guarda en Firestore ni en el almacenamiento propio de la app.

Una sesión restaurada abre el bloqueo biométrico; un login o registro exitoso
entra directamente. La entrada como invitado cierra una sesión Firebase activa
antes de abrir la app. Desde Inicio, la flecha muestra Bienvenida biométrica si
hay sesión autenticada y Bienvenida pública si se entró como invitado. El
desbloqueo usa `expo-local-authentication` y solo continúa si el resultado
nativo indica éxito. Para probar Face ID en iOS se necesita una compilación de
desarrollo: Expo Go no lo admite. Si el dispositivo no tiene biometría, en
Bienvenida se puede entrar sin sesión.

`FREE_RECIPE_LIMIT` fija tres recetas. Para una cuenta autenticada, cada primera apertura agrega su ID a `userPreferences/{uid}.freeRecipeIds` mediante una transacción de Firestore; las recetas elegidas siguen disponibles y el cuarto ID queda bloqueado. `subscriptions/{uid}` se consulta desde el servidor y solo `tier: subscribed` con `isActive: true` da acceso completo. Si `expiresAt` está vencido, el acceso vuelve a los tres IDs gratuitos. En desarrollo, el botón «Simular suscripción» muestra una vista separada que no cambia el acceso. Stripe Checkout mensual puede [probarse con Firestore en línea y Spark](docs/stripe-spark-firestore-online.md), [probarse con emuladores](docs/stripe-pruebas-locales.md) o [desplegarse con Firebase Functions](docs/stripe-pruebas.md) si el proyecto activa Blaze. Para pasar la carpeta a otra persona, usa la [guía de entrega](docs/ENTREGA_DESARROLLADOR.md).

Buscar consulta el repositorio de recetas después de 250 ms sin escritura y descarta respuestas obsoletas. Descubrir escucha el acelerómetro solo mientras la pestaña está activa y la app está en primer plano. La detección elimina la gravedad mediante un filtro, calcula RMS y exige movimiento sostenido para entrar y reposo sostenido para rearmarse. Cada nuevo descubrimiento requiere otra sacudida válida; no hay acción manual para seleccionar otra receta. `FREE_SHAKE_LIMIT` permite tres descubrimientos exitosos, guardados localmente; `SUBSCRIBED` activo no consume ese contador. El comportamiento físico del sensor requiere verificación en dispositivo. Guardadas escucha en tiempo real los IDs de favoritos y recupera sus detalles desde el repositorio de recetas.

El sensor de luz ambiente de `expo-sensors` funciona en Android compatible. La app comprueba su disponibilidad y lo escucha con una frecuencia baja solo en primer plano. Una lectura de hasta 10 lux durante 1,5 segundos activa el tema oscuro; desde allí se requieren al menos 30 lux durante el mismo tiempo para volver al claro. En iOS, web o dispositivos sin ese sensor se usa la apariencia del sistema.

AsyncStorage conserva temporalmente los IDs gratuitos y favoritos de invitados,
y las preferencias actuales de la interfaz. Las cuentas autenticadas obtienen
su acceso de Firestore, sin usar el antiguo nivel simulado local. La sesión y
los datos de identidad provienen de Firebase. Las Cloud Functions de Stripe
verifican los eventos de prueba antes de escribir suscripciones activas. Aún no
se han desplegado ni probado con Stripe porque falta la cuenta. No hay pagos
reales ni recetas creadas por usuarios.

La foto de Perfil se selecciona con `expo-image-picker` y se copia mediante la
API actual de `expo-file-system` al directorio interno de documentos antes de
guardar su URI local bajo el UID de la cuenta. Al reemplazarla se intenta
eliminar la anterior. Aún no se sube la imagen ni se cambia `photoURL` en
Firestore. La cámara requiere permiso; la galería usa el selector del sistema.

## Dependencias y publicación

### Firebase

El cliente de Firebase se inicializa al arrancar la app desde `app/_layout.tsx`.
`src/firebase/config.ts` exporta `db` para la base Cloud Firestore Standard
`(default)` y `src/firebase/auth.ts` prepara Authentication con persistencia en
AsyncStorage en Android/iOS. En web se usa `src/firebase/auth.web.ts`.

La configuración local del proyecto `asesorut-7bf6e` está en `.env`, excluido de
Git. `.env.example` enumera las variables que necesita cualquier integrante del
equipo. Antes de compilar con EAS hay que configurar allí las mismas variables
`EXPO_PUBLIC_FIREBASE_*`; son identificadores públicos, no secretos.

`src/models/` contiene los tipos de los documentos acordados para usuarios,
favoritos, preferencias y suscripciones. El registro escribe los tres
documentos iniciales y el perfil lee `users/{uid}`. Los favoritos de usuarios
autenticados se guardan en `userFavorites/{uid}/favorites/{recipeId}` con
`recipeId`, `provider` y `createdAt` (fecha del servidor). La pantalla Guardadas
y el botón del detalle escuchan los cambios con `onSnapshot`; invitados siguen
usando favoritos locales separados. Las recetas se recuperan de su fuente con
el ID guardado, sin copiar su contenido en Firestore. Para probarlo, guarda una
receta tras iniciar sesión y comprueba que aparece bajo tu UID en Firestore;
quita el favorito y comprueba que desaparece. Las reglas de Firestore deben
permitir leer y escribir esa subcolección solo cuando
`request.auth.uid == uid`. Hay que integrar este bloque en las reglas actuales
de la base antes de usar favoritos autenticados:

```firestore
match /userFavorites/{uid}/favorites/{recipeId} {
  allow read, create, delete: if request.auth != null && request.auth.uid == uid;
}
```

Los favoritos guardados antes de esta fase en
AsyncStorage no se migran automáticamente a la cuenta.

El repositorio de suscripciones solo lee `subscriptions/{uid}`; el cliente no
puede activar ese documento. Las selecciones gratuitas se leen y actualizan en
`userPreferences/{uid}`. Para probar esta fase con una cuenta, abre tres recetas
distintas y comprueba sus IDs en `freeRecipeIds`; vuelve a abrir una de ellas y
verifica que no se duplica. Una cuarta receta debe quedar bloqueada. En otro
dispositivo con la misma cuenta deben aparecer los mismos tres IDs. Pulsa
«Simular suscripción» en desarrollo y comprueba que el cuarto ID sigue
bloqueado y que `subscriptions/{uid}` permanece en `free`.

Las reglas de Firestore deben limitar cada documento a su propietario y
mantener `subscriptions/{uid}` sin actualizaciones del cliente. Antes de lanzar
pagos reales, las reglas o un backend también deberán impedir que un cliente
modificado amplíe o reemplace `freeRecipeIds` fuera del límite de tres.

Las versiones instaladas se ajustan a Expo SDK 57. `expo-local-authentication` se usa para la verificación nativa. `expo-image-picker` y `expo-file-system` permiten capturar, seleccionar y persistir el avatar. `expo-audio` sustituye a `expo-av`; su uso queda reservado para una fase posterior. `expo-asset` está instalado porque es una dependencia nativa requerida por `expo-audio`. No se solicitan permisos de micrófono ni audio en segundo plano.

Antes de distribuir, configurar fuentes de recetas y revisar las advertencias transitivas de dependencias con una actualización compatible del SDK. Una corrección automática forzada puede introducir versiones incompatibles.
