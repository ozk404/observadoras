# Fase 3, incremento 1 — Validación interna independiente

Autorizado por el usuario en esta conversación. OpenAI real sigue pendiente. No añadir devolución, cierre, seguimiento ni alertas todavía.

## Conducta

Pendiente → Validado internamente → Publicado. Solo una revisora habilitada puede validar un registro enviado, con confirmación explícita y versión vigente. La operación guarda usuario, fecha y evento en una sola sentencia atómica; no genera publicación ni solicitudes IA. Borradores propios siguen editables y borradores ajenos privados. Participantes y visitantes no validan.

La publicación requiere una validación interna previa y sus confirmaciones públicas independientes. Un registro validado puede permanecer privado indefinidamente. La validación cambia la versión; resultados de IA que lleguen después son obsoletos y se descartan mediante el control existente. Después de validar, las sugerencias previas son consultables pero no se regeneran; su resumen puede llevarse explícitamente al borrador público.

## Compatibilidad de datos

Migración aditiva: metadatos de validación y estado `validated`; ampliar restricción de eventos. Para publicaciones previas se conserva la persona y fecha reales de su aprobación como evidencia `legacy_publication`. No se inventa evento ni una validación histórica separada. La interfaz distingue esa procedencia. Si hay estados publicados sin publicación atribuible, la migración falla transaccionalmente en lugar de inventar datos.

## Aceptación

Validar sin OpenAI; no aparecer en catálogo ni ser recuperable mediante ID original público; persona/fecha persistentes; no validar sin rol, sin confirmación, con versión obsoleta, en borrador o repetidamente. Concurrencia: una transición y un evento. Publicación posterior requiere nueva confirmación y versión. Probar migración con datos del esquema previo y conservar originales/publicaciones. Regresión de fases 1 y 2 con proveedor simulado; ninguna llamada real a OpenAI.
