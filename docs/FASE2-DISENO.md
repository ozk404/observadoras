# Fase 2 — Asistencia mediante OpenAI

Proveedor elegido por el usuario el 25 de octubre de 2026. Se conserva Next.js, PostgreSQL y Compose. La conexión se hace desde el servidor a Responses API, sin herramientas, archivos ni modelos propios.

## Recorrido y aceptación

1. Solo una revisora habilitada abre un registro pendiente y prepara un texto específico para IA; no se copia el original automáticamente.
2. Se detectan identificadores comunes localmente y en el servidor. La revisora puede depurarlos y debe confirmar la revisión contextual y que usa datos ficticios. Si persiste una señal, no hay solicitud externa. La detección no garantiza anonimización ni reemplaza revisión humana.
3. Con API key y modelo definidos en variables privadas, se envía solo ese texto a OpenAI. La aplicación exige modo ficticio hasta cerrar D-07. `store:false` no equivale a retención cero por parte del proveedor.
4. Categorías orientativas (ejemplos del TDR, no taxonomía aprobada) y resumen interno se validan por esquema y se guardan como sugerencias separadas. No se solicita riesgo. No se infieren patrones entre casos a partir de un solo relato.
5. Una revisora puede llevar explícitamente el resumen a un borrador público editable, que sigue requiriendo confirmaciones humanas. No se modifican decisiones o publicaciones previas.
6. Clave/modelo ausentes, rechazo, timeout, error o respuesta inválida se presentan sin perder registros ni bloquear la revisión manual.

Persistencia: análisis privado con versión del registro, hash del texto preparado, modelo, autora de la solicitud, estado, fecha y resultado validado. No guardar texto de entrada adicional, respuesta cruda, claves ni detalles privados en logs. Evitar solicitudes concurrentes sobre el mismo registro y descartar resultados obsoletos.

Verificación: pruebas unitarias de protección y contrato HTTP con transporte simulado; integración de PostgreSQL y navegador en Compose separado con proveedor simulado y datos ficticios; regresión de fase 1; build y tipos. La simulación se etiqueta y no demuestra una llamada real a OpenAI. Una prueba real requiere credenciales configuradas localmente y se informa separadamente.

Fuentes consultadas: https://developers.openai.com/api/docs/guides/structured-outputs y https://platform.openai.com/docs/guides/your-data . Modelo configurable sin valor predeterminado para no imponer costo o disponibilidad de cuenta.

D-03 y D-04 continúan abiertas. D-07: se eligió proveedor, pero siguen pendientes condiciones institucionales para procesar datos reales. No se habilita ese tratamiento con esta entrega. Fases 3 y 4 permanecen fuera del incremento.
