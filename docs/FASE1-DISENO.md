# Fase 1 — Diseño y alcance acordado

Decisiones confirmadas por el usuario el 25 de octubre de 2026 en esta conversación. No representan una nueva aprobación contractual de la Fundación.

## Base y recorrido

El repositorio partía solo de Markdown. Next.js + React + TypeScript, PostgreSQL y Docker Compose forman una aplicación integrada; la futura IA consumirá APIs externas desde el servidor. Sin FastAPI ni modelos propios.

La fase 1 incluye index básico, registro público sin cuenta, catálogo público y área privada. El flujo acordado es envío → revisión humana → redacción de versión pública → aprobación explícita → catálogo. También incluye acceso cerrado, borradores privados, envío, listado y detalle autorizados.

El original nunca se expone desde consultas públicas. Una publicación tiene identificador, título y texto independientes, persona revisora y fecha. Solo el rol reviewer puede publicar registros pendientes; ninguna automatización publica. Los borradores solo son visibles/editables por su autora, incluso frente a revisores. Las cuentas se provisionan por comando; no hay registro abierto.

## Secuencia de ejecución y aceptación

1. Base reproducible, migración y manejo de cuentas. Verificar Compose, migración repetible y acceso deshabilitado.
2. Index y componentes de identidad: blanco, morado #69088B, fuente Manrope autoalojada como propuesta; sin logo inventado. Verificar móvil, teclado y estados vacíos.
3. Borrador y envío autenticados. Verificar persistencia, aislamiento, concurrencia y bloqueo de edición tras enviar.
4. Recepción pública. Validación, tamaño limitado, origen, campo trampa, token temporal, límites persistentes y clave idempotente. Verificar que el envío no publica.
5. Cola, lectura y publicación humana. Verificar permiso en servidor, versión pública independiente, confirmaciones y atribución transaccional.
6. Pruebas de integración, build y documentación operativa. No declarar despliegue institucional ni uso con datos reales.

## Límites

Solo título y descripción como ficha mínima provisional; sin adjuntos, contacto, taxonomía o riesgos inventados. La fase 2 añade sugerencias de IA y la fase 3 amplía revisión/seguimiento. El dashboard queda en fase 4. No se habilitan envíos automáticos ni denuncias ante autoridades.

Recepción pública y catálogo reemplazan, por indicación expresa del usuario, las restricciones previas que excluían un portal público de versiones revisadas. El original y los borradores siguen privados.

Conservación, canal institucional de derechos, alojamiento, HTTPS, respaldos y política de publicación requieren confirmación antes de datos reales. La revisión de privacidad es humana: no se promete anonimización automática. No hay herramienta de retirada/edición pública en este incremento; su procedimiento institucional debe definirse antes de publicar datos reales.
