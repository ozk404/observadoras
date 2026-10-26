# Estado actual — 26-10-2026

Este resumen prevalece para conocer el estado técnico vigente. Los diseños y verificaciones anteriores conservan el alcance de su fecha, incluidos pendientes que luego se resolvieron.

## Implementado y verificado localmente

- Next.js + TypeScript + PostgreSQL y Docker Compose; aplicación y worker con la misma imagen.
- Reporte público sin cuenta, captura obligatoria, URL opcional y descripción; originales privados y catálogo independiente de versiones aprobadas por humanos.
- Acceso cerrado con roles participante/revisora; borradores internos, devolución y reenvío de ajustes, validación y publicación separadas.
- Análisis inicial automático de descripción y captura con OpenAI; cola persistente, recuperación y fallos acotados. Clasificación humana independiente, sin certificación de veracidad ni riesgo automático.
- Seguimiento privado: notas y cierre manual que conserva la publicación. Borradores de alerta manuales o asistidos por IA, con procedencia y guardado explícito, sin difusión automática.
- Contenido real autorizado por el usuario con consentimiento versionado del envío. Las pruebas siguen usando fixtures ficticios y proveedor simulado. No se reautorizan registros anteriores.
- Rutas públicas `/reportar` y `/reportes`; enlaces anteriores redirigen conservando identificadores y paginación.

Última validación: 30/30 pruebas de servidor con PostgreSQL, 29/29 recorridos completos y 7/7 comprobaciones afectadas por ajustes finales de texto. TypeScript, construcción y actualización local correctos; aplicación/PostgreSQL saludables, worker activo. Ver `REPORTES-REALES-VERIFICACION.md`.

## Pendiente

- Fase 4: dashboard mínimo privado con agregados de reportes validados, clasificación humana y período. Siguiente incremento autorizado en el chat.
- Evaluación institucional de calidad de IA, taxonomía oficial y criterios de riesgo. No inventar esos criterios.
- Búsqueda/filtros operativos del listado, si se autorizan; administración de cuentas disponible actualmente por comandos.
- Operación institucional: conservación, canal de derechos, retirada de publicaciones, alojamiento, HTTPS, respaldo y restauración comprobada. La autorización técnica del usuario no equivale a aprobación institucional.
- Transferencia final y prueba de aceptación con el equipo. No se declara completo el producto por tener pruebas locales.

## Trazabilidad

Migraciones 001–010 aditivas y documentos de verificación por incremento. El corte de consolidación conserva implementación, pruebas y documentación existentes, sin incluir `.env`, credenciales locales, capturas ni datos de base.
