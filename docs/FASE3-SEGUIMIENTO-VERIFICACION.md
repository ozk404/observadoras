# Seguimiento y cierre privado — verificación 26-10-2026

Acuerdo: revisoras guardan notas privadas y cierran seguimiento con motivo, persona y fecha. El usuario confirmó conservar las publicaciones. El cierre es independiente del estado principal: no cambia validación, evidencia o versión pública. Después del cierre no se admiten más notas ni reapertura en este incremento.

## Cambios

- Migración 007 aditiva: historial de notas/cierre y unicidad del cierre, sin eventos retroactivos.
- Contrato estricto y servicio transaccional: rol habilitado comprobado durante escritura, bloqueo del registro, estado validado/publicado y versión vigente. Las operaciones concurrentes no duplican transiciones ni sobrescriben cambios.
- Endpoint privado `/api/privado/registros/[id]/seguimiento`; GET/POST exclusivos de revisoras, sin caché. Notas y metadatos no forman parte de la proyección general ni del catálogo.
- Panel Seguimiento con etiqueta de campo, acciones y un historial atribuible, sin explicaciones redundantes. Bloqueo durante escritura y actualización de datos para impedir enviar una acción con una versión anterior al propio guardado.

## Comprobaciones

- `npm run typecheck`: salida 0.
- `docker compose build app`: salida 0, compilación y TypeScript correctos.
- `docker compose -p observadoras-followup-test -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app npm test`: salida 0, **24/24 pruebas**, ninguna omitida. Migración conserva los datos y publicaciones previos, sin inventar seguimiento histórico.
- `node scripts/test-e2e.mjs` con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-followup-test` y `TEST_AI=true`: salida 0, **20/20 recorridos**.
- Los tres nuevos recorridos verifican: notas desde la interfaz y persistencia tras recargar; cierre con motivo y confirmación; publicación conservada; historial exclusivo de revisoras; aislamiento de participante autora y visitante; estados no admitidos, campos de identidad forjados, origen ajeno y versión antigua; rechazo de nuevas notas/cierres repetidos; concurrencia de cierre/publicación y de dos cierres; publicación de un validado cuyo seguimiento ya se cerró.
- Navegación por teclado y comprobación de ancho móvil de 390 px. Inspección visual de `artifacts/followup-desktop.png` y `artifacts/followup-mobile.png`, capturas ficticias ignoradas por Git.
- Se mantuvieron los recorridos anteriores de recepción, evidencias, ajustes, validación, publicación e IA. Proveedor simulado: no se hicieron nuevas llamadas reales a OpenAI durante esta implementación. Las cuentas de prueba quedaron deshabilitadas al finalizar.

La primera ejecución detectó una carrera entre guardar nota y refrescar la versión del formulario: el servidor rechazó la acción obsoleta sin perder datos. Se mantiene bloqueado el formulario hasta terminar la actualización. Después se corrigió una espera de navegación del test del catálogo. La ejecución completa final pasó.

## Entorno local

`docker compose up -d --no-build`: salida 0. App y PostgreSQL saludables, worker en ejecución, salud HTTP 200 y seguimiento sin sesión HTTP 401. Los conteos anteriores se conservaron: dos cuentas habilitadas, cuatro registros, una publicación y tres evidencias; seguimiento histórico vacío. Los servicios aislados se detuvieron sin eliminar su volumen. Las credenciales locales no se modificaron.

## Límites

Quedan pendientes borradores de alertas, dashboard, reapertura y tratamiento institucional de datos reales. Este incremento no atribuye a la Fundación políticas nuevas de resolución, priorización, retirada o notificación.
