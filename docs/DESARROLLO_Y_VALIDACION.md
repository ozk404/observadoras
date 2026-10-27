# Desarrollo y validación

## Iterar sin builds

```powershell
node scripts/dev.mjs up
```

Único entorno de trabajo: http://localhost:3000, con recarga automática mediante Webpack/polling. Usa `.env` y el volumen existente de PostgreSQL, conservando cuentas y reportes. `compose.override.yaml` monta código/recursos y una caché de desarrollo independiente. El worker también usa código montado. No reconstruir ni recrear contenedores por cambios de texto, CSS, imágenes o componentes.

```powershell
node scripts/dev.mjs logs
node scripts/dev.mjs down
```

`down` detiene app/worker sin borrar datos. La primera instalación requiere construir la imagen base una vez; nuevas dependencias sí requieren actualizar la imagen. La primera visita compila la ruta; las siguientes ediciones se reflejan en pocos segundos. Algunas ediciones causan recarga completa: guardar formularios antes de modificar código.

Las pruebas de datos y permisos usan exclusivamente fixtures en una base separada. Se levantan bajo demanda y no sustituyen el entorno de trabajo:

```powershell
node scripts/dev.mjs test-up --ai
# Ejecutar ui/auth según el flujo
node scripts/dev.mjs test-down
```

El puerto3100 y `.env.dev` se reservan para estas pruebas, con proveedor simulado. Nunca ejecutar fixtures en3000 ni apuntar pruebas a `.env`. `test-down` conserva volúmenes. Para comprobar una entrega empaquetada, usar explícitamente `docker compose -f compose.yaml up -d --build`; volver al modo de trabajo con `node scripts/dev.mjs up`.

Antes de ejecutar pruebas de navegador por primera vez en un equipo, preparar las dependencias del host una sola vez:

```powershell
npm ci
npx playwright install chromium
```

## Validación proporcional

| Cambio | Comprobación |
|---|---|
| Texto, CSS, imagen | Revisión visual de la zona afectada en escritorio/móvil; no crear pruebas que solo copien estilos |
| Interacción | Pruebas focalizadas del comportamiento, teclado, cierre/errores y conservación de datos |
| API, permisos, estado o almacenamiento | Integración del flujo y separación de originales/publicaciones con fixtures |
| Documentación o herramientas | Sintaxis/configuración y ejecución de la herramienta afectada |

```powershell
# Tutorial y retícula actuales; sin provisionar cuentas
node scripts/dev.mjs ui
# Otro archivo público o filtro sobre los archivos predeterminados
node scripts/dev.mjs ui home-v2.spec.ts
node scripts/dev.mjs ui --grep "welcome"
# Flujo principal: cuatro cuentas temporales, deshabilitadas al terminar
node scripts/dev.mjs auth --fixtures=core phase-one.spec.ts
node scripts/dev.mjs auth --fixtures=core team-queue.spec.ts
# Integración que necesita worker y simulación de IA
node scripts/dev.mjs auth --ai --fixtures=all intake.spec.ts
```

El helper de autenticación reinicia los contadores de frecuencia solo después de verificar origen 3100, modo de simulación, endpoint local y nombre real de la base observadoras_dev. Ejecutar una sola suite autenticada a la vez. Los tiempos máximos de espera son mayores en desarrollo por la compilación inicial de rutas; no añaden esperas fijas ni cambian los del artefacto de producción.

El runner original sigue aceptando --fixtures=all (por defecto). Core reduce las operaciones de provisión/limpieza de 23 a 9. No combinar core con pruebas que necesitan cuentas especializadas. Los registros ficticios permanecen en la base de desarrollo; no son fixtures de producción. No ejecutar las pruebas por defecto contra3000.

No ampliar ni repetir comprobaciones aprobadas sin cambios, fallos o riesgos pendientes que lo justifiquen. Se puede comprobar la interacción sin build; cerrar la revisión visual antes del empaquetado. No mezclar capturas de datos reales con artefactos de pruebas.

## Cerrar un incremento de aplicación

Una vez terminados los ajustes y las pruebas seleccionadas:

```powershell
docker compose -f compose.yaml build app
# Solo para cambios de frontend, sin migraciones ni cambios del worker
docker compose -f compose.yaml up -d --no-deps app
```

Un build final por incremento coherente. Si el cambio afecta backend/worker/migraciones, actualizar los servicios y ejecutar las comprobaciones correspondientes; no usar --no-deps para omitir una migración necesaria. Documentación/pruebas sin cambios de runtime no necesitan build ni despliegue. Comprobar salud y apertura de la ruta al actualizar, sin repetir todos los recorridos sobre el mismo artefacto.

Los cambios visuales dentro de una dirección aprobada no requieren reiniciar diseño, especificación, revisión por subagente y documento de verificación por cada retoque. Registrar brevemente el cambio, las comprobaciones realizadas y los límites; reservar especificaciones extensas para decisiones nuevas o cambios de alcance.

## Comprobaciones del entorno (26-10-2026)

Compose y TypeScript correctos. Se verificaron ausencia de .env/.env.review en el contenedor, base observadoras_dev, proveedor simulado y reutilización del volumen de dependencias sin reinstalar. La CSP de producción coincide con la anterior; eval/WebSocket solo se habilitan en desarrollo. La edición temporal de CSS se restauró íntegra tras comprobar la recarga.

El arranque lento descubrió interacción antes de hidratar controles: se bloquearon temporalmente login/borrador/validación/publicación hasta estar listos y se añadió method=post como respaldo. Se prueba explícitamente login y borrador sin JavaScript. El test público espera disponibilidad del token antes de contar su edad mínima, sin modificar el control de abuso del servidor.

Resultado final: interfaz 8/8 y perfil core 5/5 aprobados en desarrollo, incluidas pruebas de permisos y formularios sin JS; cuentas ficticias habilitadas al terminar: 0. TypeScript y un único build final aprobados (imagen79b8754657d5). Actualizada solo app con --no-deps; worker principal conservó su contenedor. Apertura de /reportar y /ingreso sin errores y CSP empaquetada conservada. Perfil ai de desarrollo arrancado y detenido correctamente, sin proveedor real. Entorno de desarrollo permanece disponible para iterar.

Los primeros pases detectaron acciones antes de hidratar, edad mínima del token contada demasiado pronto y compilación inicial que excedía la espera de producción. Se corrigieron disponibilidad de controles, condición inicial del test y timeout exclusivo de dev antes del pase final. No se repitió la suite completa de servidor por no cambiar permisos/API/SQL.
