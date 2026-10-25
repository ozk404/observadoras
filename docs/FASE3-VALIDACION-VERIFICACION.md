# Fase 3, incremento 1 — Verificación de validación interna

25 de octubre de 2026. Implementado el incremento acotado autorizado: validar internamente sin publicar. La conexión real con OpenAI continúa pendiente; no se hicieron llamadas externas.

## Resultado funcional

Solo una revisora habilitada puede confirmar una validación sobre un registro pendiente y versión vigente. Usuario, fecha, estado, versión y evento se guardan atómicamente. El original permanece privado y no se genera publicación. Una versión pública se prepara después y requiere confirmaciones independientes. La validación no constituye acreditación judicial.

La publicación conserva los metadatos de validación. Cambiar la versión/estado descarta respuestas IA tardías; las sugerencias anteriores quedan separadas y consultables. Borradores y permisos de autoría se conservan. No se implementaron ajustes, cierre, alertas ni dashboard.

## Compatibilidad

Migración 003 con estado `validated` y metadatos de persona, fecha y procedencia. Publicaciones previas conservan la evidencia humana real de su publicación, identificada como `legacy_publication`; no se inventan eventos o tiempos de una validación separada.

La prueba de migración crea un esquema temporal transaccional con el esquema 001 y fixtures previos, aplica 003 y verifica que original, publicación, identificador y atribución se conservan; pendientes permanecen sin validar y no se permiten validaciones incompletas. Se revierte íntegramente la transacción. No modifica registros existentes.

## Comprobaciones

| Comando o comprobación | Resultado |
|---|---|
| `npm run typecheck` | Código 0 |
| `npm test` local | Código 0; 13 aprobadas, prueba de migración reservada a PostgreSQL |
| `docker compose build app` | Código 0; build de producción y TypeScript aprobados |
| `docker compose -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app npm test` | Código 0; **14 aprobadas, ninguna omitida** |
| `node scripts/test-e2e.mjs` con entorno aislado y proveedor simulado | Código 0 en ejecución final; **9 escenarios aprobados, ninguno omitido** |
| Configuración de ambos Compose | Código 0 |
| Capturas de validación en escritorio y móvil | Inspeccionadas; sin desbordamiento a 390 px |

Los nueve escenarios incluyen siete regresiones adaptadas al nuevo paso previo y dos específicos de validación: confirmación, persona/fecha persistentes, ausencia del catálogo y rechazo del ID original público, publicación posterior separada, metadatos conservados y ausentes de la vista pública, rechazo de visitantes/participantes, origen ajeno, versión obsoleta, borradores, revalidación y concurrencia con una sola transición.

En el primer pase falló una espera de una prueba de regresión: buscaba texto repetido del catálogo antes de confirmar la navegación al detalle. Se corrigió para esperar URL de detalle y verificar el cuerpo de ese detalle. La suite completa final pasó; no fue necesario cambiar el comportamiento de la aplicación por ese fallo.

Se comprobó la unicidad de eventos de validación y su correspondencia con la persona registrada. Las cuentas ficticias de ambas ejecuciones se deshabilitaron. Datos de integración permanecen en el volumen aislado de pruebas, no en la aplicación principal.

## Archivos principales y límites

`db/migrations/003_internal_validation.sql`, `src/server/reports.ts`, nuevo endpoint `validacion`, `src/components/validation-form.tsx`, estado y detalle privados, separación de permisos en `ai-review.tsx`, pruebas y documentación. El cambio en IA solo adapta la interfaz al estado revisado; la conexión real sigue pendiente.

Este informe acredita verificación local del incremento, no cierre de toda la fase 3, despliegue institucional ni autorización para datos reales. El siguiente incremento propuesto es solicitar ajustes en registros internos; el tratamiento de envíos sin cuenta requiere definición específica porque no hay canal de contacto. No se avanzó a ese trabajo.
