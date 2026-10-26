# Fase 3 — Generación asistida de borradores de alerta

## Alcance

El usuario autoriza continuar con la capacidad pendiente: generar texto nuevo de alerta con IA. Se reutiliza OpenAI Responses y el modelo configurado, sin servicios nuevos. El borrador editable y su guardado privado siguen siendo independientes de la generación. No se envía, publica, aprueba ni deriva una alerta.

Se elige solicitud explícita con texto preparado por la revisora, frente a adjuntar automáticamente denuncia/captura/notas (descartado por privacidad) o guardar automáticamente la respuesta (descartado por autonomía humana y concurrencia).

## Entrada y salida

- Solo revisoras habilitadas sobre registros validados/publicados, incluidos aquellos con seguimiento cerrado.
- Entrada estricta: texto preparado entre 20 y 6000 caracteres, confirmaciones de revisión de privacidad y contenido ficticio, versiones del registro y del borrador (0 si no existe).
- Modo `synthetic` obligatorio; detección local de identificadores antes de la llamada. No adjuntar original, captura, URL, resumen, notas ni identificadores de cuentas/registro automáticamente.
- Salida estructurada estricta: título 5–160 caracteres, texto 20–6000 y limitaciones 10–1000. Español cuidadoso, no partidista, sin revictimización, acusaciones categóricas, identidades, riesgo inventado ni afirmaciones de veracidad. Entrada no confiable; sin herramientas. Filtrar señales identificables también en la salida.
- Mantener `store:false`, tiempo de espera y límite de respuesta del adaptador existente. No afirmar retención cero ni anonimización garantizada.

## Persistencia y concurrencia

Migración 009: historial privado `alert_generations`, con registro, versiones base, solicitante, hash del texto (sin texto preparado), modelo, transporte, estado, resultado, error y fechas. Un único trabajo en curso por registro; los trabajos abandonados vencen a los dos minutos y se recuperan solo al solicitar otra generación. No hay reintentos automáticos ni backfill.

Antes de llamar, transacción con bloqueo de registro/borrador, cuenta habilitada, estado y versiones. Aplicar cuotas existentes compartidas de IA por revisora y global. Confirmar resultado en otra transacción, revalidando cuenta, estado y ambas versiones. Si cambiaron o venció el trabajo, descartar el resultado con conflicto controlado. El fallo mantiene el borrador guardado y la revisión manual disponibles.

La generación no cambia versiones, estado del registro ni el borrador guardado. Solo conserva una propuesta aparte. Consulta exclusiva de revisoras por endpoint privado, sin caché; el catálogo y las participantes no reciben propuestas ni metadatos.

Añadir referencia opcional a generación en `alert_drafts`, excluyente con las bases existentes. Al guardar una propuesta nueva, validar que sea exitosa, del mismo registro y de las versiones base actuales. Al editar un borrador que ya referencia esa misma generación, conservar su procedencia sin exigir que la versión anterior de generación coincida con la versión incrementada por su propio guardado.

## Interfaz

En Borrador de alerta, sección desplegable «Generar con IA» con texto preparado, dos confirmaciones y acción de generación. Las confirmaciones se reinician al cambiar el texto. Mientras la solicitud local está activa, bloquear edición/guardado del borrador para evitar perder cambios en esa pantalla; otras pantallas siguen protegidas por versiones del servidor.

Mostrar propuesta y limitaciones separadas del editor. «Usar propuesta» copia título y texto, pide confirmación al reemplazar contenido y registra procedencia; no guarda. No permitir aplicar una propuesta de versiones antiguas. Tras recargar, mostrar la última solicitud/resultado privado con sus errores o estado; mantener redacción manual ante error o falta de configuración. Texto mínimo según ADN.

## Secuencia y aceptación

1. Revisar diseño, preservar cambios existentes y mantener modelo configurado.
2. Añadir contrato, migración y adaptación estructurada de Responses; no alterar los contratos existentes de resumen y captura.
3. Servicio de solicitud/finalización, lectura y procedencia; integrar endpoint y formulario.
4. Pruebas de contrato de API, rechazos, timeout, privacidad, versiones, permisos y fuentes. E2E: generar/aplicar/editar/guardar; nada se guarda automáticamente; fallo conserva el borrador; salida obsoleta descartada; solicitud concurrente única; recuperación de trabajo vencido; procedencia tras sucesivas ediciones; catálogo independiente; teclado/móvil.
5. TypeScript, build Docker, pruebas PostgreSQL y recorridos completos con proveedor simulado; una llamada real acotada con texto ficticio, sin leer registros guardados, si la configuración sigue disponible. Actualizar documentación y entorno local conservando datos.

Fuentes: guía oficial [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), consultada el 26-10-2026, y controles ya presentes de Responses. Datos reales, revisión institucional de taxonomía, circulación de alertas y dashboard quedan fuera de este incremento.
