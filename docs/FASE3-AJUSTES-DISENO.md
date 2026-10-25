# Fase 3, incremento 2 — Solicitar ajustes de registros internos

Alcance autorizado en la conversación: una revisora devuelve un registro interno pendiente con observación; su autora corrige, guarda avances y reenvía. El proceso permanece privado. No habilitar este flujo para envíos sin cuenta, ni inventar contactos/notificaciones. Cierre y alertas quedan fuera.

## Estados y permisos

Pendiente → Requiere ajustes → Pendiente → Validado internamente → Publicado. Solo la revisora habilitada puede solicitar ajustes de registros pendientes con autora interna, confirmación y versión vigente. No devolver borradores, validados, publicados o un registro que ya espera ajustes. Solo su autora puede editar y reenviar; guardar avances mantiene Requiere ajustes. Reenviar exige los campos mínimos actuales y cierra la solicitud, sin validar ni publicar.

Conservar solicitudes anteriores, observación, persona/fecha y reenvío de la autora. Un índice permite solo una solicitud abierta por registro. Las transiciones, eventos y resolución se guardan atómicamente y verifican versión para impedir pérdida de cambios. Las observaciones no aparecen en catálogo ni se envían automáticamente a IA.

Las sugerencias previas se marcan como anteriores a los ajustes y no se pueden llevar al borrador público. Una respuesta IA en curso se descarta por estado/versión. Después del reenvío puede solicitarse una sugerencia nueva, siempre bajo controles ya existentes. No hacer llamadas reales a OpenAI durante esta implementación.

## Aceptación

Recorrido revisora → autora → reenvío, persistencia de avances e historial de dos ciclos; aislamiento de participantes; denegación a visitantes; rechazo de observación vacía, origen ajeno, versión obsoleta, envíos sin cuenta y estados no permitidos; una solicitud/evento ante concurrencia; no validar/publicar mientras espera ajustes; evidencia y versión vigentes antes de publicación posterior; no reutilizar sugerencias obsoletas. Migración aditiva conservando datos previos. Pruebas con registros ficticios, build, tipos y verificación móvil.
