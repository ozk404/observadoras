# Desarrollo y validación

## Iterar sin builds

```powershell
node scripts/dev.mjs up
```

Desarrollo: http://localhost:3100. Aplicación local empaquetada: http://localhost:3000. No cambiar de entorno sin comprobar la URL. Usa exclusivamente información ficticia en 3100.

El comando genera `.env.dev` una sola vez y conserva sus secretos; no lee ni monta `.env` o `.env.review`. PostgreSQL, red, dependencias Linux y caché Next tienen volúmenes propios. OpenAI apunta al simulador local. El worker solo arranca con `node scripts/dev.mjs up --ai`.

Código y recursos se montan directamente. No ejecutar Docker build/up tras cada edición. Las dependencias se instalan solo al cambiar lockfile, Node o plataforma; para cambiar paquetes usa npm de forma que package-lock.json quede actualizado y vuelve a ejecutar up. Los node_modules del host no se montan en Linux.

En este Windows, Turbopack no detectó cambios de bind mounts. Se usa Webpack con polling: la prueba de CSS detectó cambios en aproximadamente 5 s. Algunos módulos CSS provocan recarga completa y pierden valores no enviados; no probar con datos reales. La primera instalación/compilación tarda más; las siguientes ediciones reutilizan dependencias y caché.

```powershell
node scripts/dev.mjs logs
node scripts/dev.mjs down
```

Down conserva los volúmenes. Mantener el entorno levantado durante el lote de trabajo. El puerto 3100 también lo usa compose.ai-test.yaml: detener uno antes de iniciar el otro. No usar down -v, limpiar volúmenes ni modificar límites en la base principal.

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
# Integración que necesita worker y simulación de IA
node scripts/dev.mjs auth --ai --fixtures=all intake.spec.ts
```

El helper de autenticación reinicia los contadores de frecuencia solo después de verificar origen 3100, modo de simulación, endpoint local y nombre real de la base observadoras_dev. Ejecutar una sola suite autenticada a la vez. Los tiempos máximos de espera son mayores en desarrollo por la compilación inicial de rutas; no añaden esperas fijas ni cambian los del artefacto de producción.

El runner original sigue aceptando --fixtures=all (por defecto). Core reduce las operaciones de provisión/limpieza de 23 a 9. No combinar core con pruebas que necesitan cuentas especializadas. Los registros ficticios permanecen en la base de desarrollo; no son fixtures de producción. No ejecutar las pruebas por defecto contra3000.

No ampliar ni repetir comprobaciones aprobadas sin cambios, fallos o riesgos pendientes que lo justifiquen. Se puede comprobar la interacción sin build; cerrar la revisión visual antes del empaquetado. No mezclar capturas de datos reales con artefactos de pruebas.

## Cerrar un incremento de aplicación

Una vez terminados los ajustes y las pruebas seleccionadas:

```powershell
docker compose build app
# Solo para cambios de frontend, sin migraciones ni cambios del worker
docker compose up -d --no-deps app
```

Un build final por incremento coherente. Si el cambio afecta backend/worker/migraciones, actualizar los servicios y ejecutar las comprobaciones correspondientes; no usar --no-deps para omitir una migración necesaria. Documentación/pruebas sin cambios de runtime no necesitan build ni despliegue. Comprobar salud y apertura de la ruta al actualizar, sin repetir todos los recorridos sobre el mismo artefacto.

Los cambios visuales dentro de una dirección aprobada no requieren reiniciar diseño, especificación, revisión por subagente y documento de verificación por cada retoque. Registrar brevemente el cambio, las comprobaciones realizadas y los límites; reservar especificaciones extensas para decisiones nuevas o cambios de alcance.

## Comprobaciones del entorno (26-10-2026)

Compose y TypeScript correctos. Se verificaron ausencia de .env/.env.review en el contenedor, base observadoras_dev, proveedor simulado y reutilización del volumen de dependencias sin reinstalar. La CSP de producción coincide con la anterior; eval/WebSocket solo se habilitan en desarrollo. La edición temporal de CSS se restauró íntegra tras comprobar la recarga.

El arranque lento descubrió interacción antes de hidratar controles: se bloquearon temporalmente login/borrador/validación/publicación hasta estar listos y se añadió method=post como respaldo. Se prueba explícitamente login y borrador sin JavaScript. El test público espera disponibilidad del token antes de contar su edad mínima, sin modificar el control de abuso del servidor.

Resultado final: interfaz 8/8 y perfil core 5/5 aprobados en desarrollo, incluidas pruebas de permisos y formularios sin JS; cuentas ficticias habilitadas al terminar: 0. TypeScript y un único build final aprobados (imagen79b8754657d5). Actualizada solo app con --no-deps; worker principal conservó su contenedor. Apertura de /reportar y /ingreso sin errores y CSP empaquetada conservada. Perfil ai de desarrollo arrancado y detenido correctamente, sin proveedor real. Entorno de desarrollo permanece disponible para iterar.

Los primeros pases detectaron acciones antes de hidratar, edad mínima del token contada demasiado pronto y compilación inicial que excedía la espera de producción. Se corrigieron disponibilidad de controles, condición inicial del test y timeout exclusivo de dev antes del pase final. No se repitió la suite completa de servidor por no cambiar permisos/API/SQL.
