# Fase 3, incremento 2 — Ajustes de registros internos

Implementado el alcance autorizado: observación privada de una revisora → corrección por la autora → nuevo envío a revisión. No se habilitan ajustes de denuncias sin cuenta, cierre, notificaciones ni alertas. Se conserva la configuración existente de OpenAI; las pruebas de este incremento no la utilizan ni hacen llamadas reales.

## Conducta verificada

- Solo revisores habilitados devuelven registros internos pendientes con observación de 10–2000 caracteres, confirmación y versión vigente.
- La autora consulta observación, revisora y fecha; edita exclusivamente su registro, guarda avances en Requiere ajustes y reenvía al completar los mínimos. No puede editar después del reenvío hasta otra devolución.
- Cada ciclo conserva solicitud y fecha/persona de reenvío. El detalle muestra hasta las 10 solicitudes más recientes; no se modifican observaciones anteriores.
- Una sola solicitud abierta por registro. La transición, observación y evento son atómicos. Reenvío, cierre de solicitud y evento se guardan juntos.
- Se rechazan visitantes, otras participantes, confirmaciones falsas, campos forjados, versiones obsoletas, origen ajeno, borradores, validados y envíos sin cuenta. No se puede validar o publicar mientras se esperan ajustes.
- La validación y publicación posteriores siguen siendo decisiones separadas. El catálogo no muestra observaciones ni el original corregido.
- Las sugerencias anteriores a la devolución se conservan con marca de obsolescencia, sin acción de llevarlas a borrador público. Respuestas en curso se descartan. Las observaciones no se agregan automáticamente a solicitudes IA.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | Código 0 |
| `npm test` local | Código 0; 14 aprobadas y 1 de migración reservada a PostgreSQL |
| `docker compose build app` | Código 0; build de producción y tipos aprobados |
| Configuración de ambos Compose | Código 0 |
| `npm test` en contenedor aislado con `TEST_DATABASE_MIGRATIONS=true` | Código 0; **15 aprobadas, ninguna omitida** |
| Playwright con proveedor simulado y datos ficticios | Código 0 en ejecución final; **12 escenarios aprobados, ninguno omitido** |
| Capturas de corrección en escritorio/móvil | Inspeccionadas; sin desbordamiento a 390 px |

La prueba de migración usa un esquema temporal transaccional con fixtures del esquema previo. Comprueba conservación de originales, publicaciones y atribución; la migración 004 no crea observaciones para datos previos; se impide el estado de ajustes para registros sin cuenta y duplicar una solicitud abierta. Se revierte toda la transacción, sin modificar datos existentes.

Los tres escenarios nuevos de navegador cubren dos ciclos completos de ajustes, guardado y reenvío, historial privado, corrección de otra autora rechazada, publicación posterior sin observaciones, validación/publicación bloqueadas durante ajustes, solicitudes concurrentes, exclusión de envíos sin cuenta y obsolescencia de sugerencias. Se ejecutaron también los nueve escenarios de regresión de fases anteriores.

En el primer pase una prueba tomó el identificador antes de terminar la navegación al detalle de una denuncia sin cuenta; se corrigió la espera de URL y se comprobó que la autora era nula antes del intento. Se reiniciaron únicamente los contadores técnicos de la base aislada para repetir la suite completa. No se cambiaron límites de la aplicación ni datos de la base principal. La suite final pasó.

## Operación y límites

Proyecto de integración separado `observadoras-adjustments-test`, puerto 3100, PostgreSQL propio y proveedor simulado. Las cuentas ficticias de las dos ejecuciones se deshabilitaron. El entorno se detiene conservando su volumen; las denuncias de la aplicación principal no se usan como fixtures.

Archivos principales: migración 004; reglas y consultas de `src/server/reports.ts`; endpoint privado `ajustes`; formulario de devolución, editor, estado e historial del detalle; marca de obsolescencia en contrato/consulta/vista de análisis; pruebas y documentación.

Este resultado cierra solo el incremento de ajustes internos en verificación local. Permanecen las condiciones institucionales para datos reales, el tratamiento de denuncias sin cuenta que necesiten aclaraciones, cierre/seguimiento ampliado, alertas y dashboard. No se avanzó a esas funciones.
