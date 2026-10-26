# Borradores internos de alertas — verificación 26-10-2026

Incremento: revisoras preparan y guardan un borrador por denuncia validada/publicada, incluso con seguimiento cerrado. Redacción manual y uso explícito de resumen IA existente como base editable. No se generan alertas nuevas por API ni se envían, aprueban, publican o derivan alertas.

## Implementación

- Migración 008 aditiva: tabla privada `alert_drafts`, registro único, versión propia, creadora/editora y fechas, referencias excluyentes a análisis inicial o preparado. No crea borradores históricos ni modifica publicaciones.
- Servicio transaccional con revalidación del rol habilitado, bloqueo del registro/borrador, estado y versiones. Comprueba pertenencia y vigencia de la base IA; rechaza análisis fallidos, ajenos o anteriores a ajustes.
- Endpoint privado GET/POST `/api/privado/registros/[id]/borrador-alerta`, sin caché, con control de origen y contrato estricto. La proyección general de registros y el catálogo no incluyen borradores ni metadatos.
- Formulario mínimo con título, texto y guardado. Usar resumen no guarda ni modifica el título y pide confirmación antes de reemplazar texto local. Conserva las versiones base durante la edición para rechazar sobrescrituras sin perder el texto local; actualiza datos entrantes cuando no hay cambios locales. Acciones bloqueadas durante guardado/refresco.

## Comprobaciones

- `npm run typecheck`: salida 0.
- `docker compose build app`: salida 0; compilación y TypeScript correctos.
- `docker compose -p observadoras-alert-test -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app npm test`: salida 0; **25/25 pruebas**, ninguna omitida. Incluye preservación de datos y ausencia de borradores retroactivos.
- `node scripts/test-e2e.mjs` con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-alert-test` y `TEST_AI=true`: salida 0; **24/24 recorridos**.
- Cuatro recorridos nuevos: guardado/edición/persistencia manual con seguimiento cerrado; uso explícito y edición de resumen inicial con procedencia; aislamiento de autora/visitante, campos forjados, origen ajeno, estados/versiones y dos creaciones/ediciones concurrentes; rechazo de análisis preparados fallidos, ajenos y obsoletos, manteniendo alternativa manual. El catálogo y el original permanecen independientes.
- Teclado y vista móvil de 390 px sin desbordamiento. Inspección de `artifacts/alert-draft-desktop.png` y `artifacts/alert-draft-mobile.png`, capturas ficticias ignoradas por Git.
- Los recorridos anteriores de ajustes, evidencias, seguimiento, validación, publicación e IA siguen pasando. La primera ejecución detectó una expectativa incorrecta del test: crear un análisis preparado devuelve 201. Se corrigió esa expectativa y la suite completa final pasó.
- Proveedor simulado en la base aislada: ninguna llamada real nueva a OpenAI. Las cuentas de pruebas se deshabilitaron al finalizar.

## Límites

Generación de alertas nuevas con IA, múltiples alertas por caso, historial completo de ediciones, aprobación y circulación institucional quedan fuera del incremento. El modo de datos reales continúa pendiente de condiciones institucionales. El uso de un resumen como base no certifica veracidad ni equivale a una salida literal de IA tras editarla.

## Entorno local

`docker compose up -d --no-build`: salida 0. App y PostgreSQL saludables, worker en ejecución, salud HTTP 200 y borradores sin sesión HTTP 401. Se conservaron los conteos anteriores: dos cuentas habilitadas, cuatro registros, una publicación, tres evidencias y ningún evento de seguimiento. La tabla nueva empieza sin borradores históricos. El entorno aislado se detuvo conservando su volumen y las credenciales locales no se modificaron.
