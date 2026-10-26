# Generación asistida de alertas — verificación 26-10-2026

Incremento: una revisora solicita una propuesta privada sobre texto preparado y confirmado ficticio, la revisa y decide aplicarla al borrador, editarla y guardarla. No se envían ni publican alertas.

## Implementación

- Migración 009 aditiva: `alert_generations` y referencia excluyente desde `alert_drafts`. Conserva datos existentes y no genera propuestas históricas. Se guarda huella del texto preparado, sin conservar ese texto en la tabla de trabajos.
- Responses con esquema estricto de título, texto y limitaciones; `store:false`, sin herramientas y solo texto preparado. No adjunta originales, evidencias, URL, notas ni identificadores internos. Se preserva el modelo configurado, `gpt-4o-mini`.
- Endpoint privado GET/POST `generacion-alerta`, control de origen, contrato estricto, permisos y versiones del registro/borrador. Revalidación transaccional al completar, incluido acceso habilitado y vencimiento real. Un resultado obsoleto, vencido o identificable no se conserva.
- Cuotas compartidas con análisis preparado: 10 solicitudes por persona/hora y 60 globales/hora. Una generación activa por registro, sin reintentos automáticos; la próxima solicitud explícita recupera trabajos abandonados de más de dos minutos.
- Propuesta separada del borrador. Aplicarla requiere acción explícita y confirmación antes de reemplazar contenido; guardar sigue siendo otra acción. Se conserva la procedencia al editar posteriormente el mismo borrador. El trabajo manual sigue disponible ante fallo de IA.

## Comprobaciones

- `docker compose build app`: salida 0, imagen completa `567e9dc3c82d`, compilación y TypeScript correctos. La construcción anterior había quedado incompleta por falta de espacio; esta ejecución sí exportó la imagen.
- `docker compose -p observadoras-alert-generation-test -f compose.ai-test.yaml up -d`: salida 0, base nueva aislada y proveedor simulado.
- `docker compose -p observadoras-alert-generation-test -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app sh -c 'node --import tsx --test --test-concurrency=1 tests/*.test.ts'`: salida 0; **29/29 aprobadas, ninguna omitida**. Incluye migración con datos anteriores, vencimiento durante llamada, recuperación de trabajo abandonado y revocación de revisora durante generación.
- `node scripts/test-e2e.mjs`, con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-alert-generation-test`, `TEST_AI=true`: salida 0; **28/28 recorridos**. Las diez cuentas ficticias se deshabilitaron al terminar.
- Cuatro recorridos nuevos comprueban aplicación/edición/guardado y procedencia, confirmaciones reiniciadas al editar, fallos del proveedor y alternativa manual, bloqueo de entrada/salida identificable, concurrencia, versiones obsoletas, roles, origen y campos forjados. Los flujos anteriores siguen pasando.
- Capturas `artifacts/alert-generation-desktop.png` y `artifacts/alert-generation-mobile.png` inspeccionadas; móvil de 390 px sin desbordamiento horizontal. Son datos ficticios y archivos ignorados por Git.
- Una llamada real previa al adaptador con texto ficticio produjo esquema válido y cero señales identificables detectadas, sin consultar denuncias ni guardar borradores. No se repitió durante esta validación. No equivale a evaluación institucional de calidad ni certificación de anonimato.
- El test paralelo del host había fallado al crear procesos; la ejecución local en serie aprobó 26 y omitió 3 de base. La ejecución final en Docker con PostgreSQL aprobó las 29 sin omitirlas.
- `git diff --check`: salida 0; solo avisos de conversión de finales de línea.

## Actualización local

`docker compose up -d --no-build`: salida 0. Migración 009 aplicada. Aplicación y PostgreSQL saludables, worker en ejecución, `/api/health` HTTP 200 y endpoint de generación sin sesión HTTP 401.

Conteos antes y después: 2 cuentas habilitadas, 4 denuncias, 1 publicación, 3 evidencias, 0 eventos de seguimiento y 0 borradores. La nueva tabla contiene 0 generaciones: no hubo procesamiento retroactivo ni llamadas reales sobre registros existentes. No se modificaron credenciales ni se eliminaron volúmenes.

## Límites

Solo pruebas ficticias; tratamiento institucional de datos reales continúa pendiente. Sin difusión, aprobación institucional de alertas, múltiples alertas por registro ni historial completo de ediciones. La propuesta no certifica veracidad. El dashboard queda fuera de este incremento.
