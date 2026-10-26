# Fase 3 — Borradores internos de alertas

## Alcance y decisiones

El usuario autorizó continuar con los borradores de alertas. La recepción, IA, revisión, publicación y seguimiento ya funcionan. Este incremento permite a revisoras preparar y conservar un borrador de alerta asociado a un registro validado o publicado. Nunca envía, publica, deriva ni genera una denuncia legal.

Se elige un borrador editable por registro, con redacción manual y uso explícito de un resumen IA existente como base. Una nueva generación remota de alertas requeriría otro contrato y controles; queda fuera de este incremento. No se copia el original, evidencia, notas de seguimiento ni texto generado por IA sin acción explícita de la revisora. Sin resumen disponible, la redacción manual funciona igual.

## Datos y permisos

- Tabla `alert_drafts`: registro único, título (5–160 caracteres), texto (20–6000), versión propia, creadora/fecha y última editora/fecha. No hay estados de envío, publicación ni aprobación.
- Procedencia opcional mediante referencia a análisis inicial o análisis preparado, con claves foráneas y exclusión mutua. El servidor verifica que el análisis pertenezca al mismo registro, haya completado correctamente y no esté obsoleto. La referencia indica que se usó como base; no acredita que el texto editado sea una salida literal de IA.
- Solo revisoras habilitadas consultan, crean y editan. Participantes, incluso autoras, y visitantes no reciben el borrador ni sus metadatos en API, páginas o catálogo.
- Solo registros validados o publicados admiten borradores. El cierre del seguimiento no impide preparar una alerta: cierre, publicación y borrador son independientes. No se habilita edición de la denuncia original.
- Migración aditiva sin borradores históricos ni cambios en registros/publicaciones existentes.

## Concurrencia

Cada guardado exige versión vigente del registro y del borrador (0 al crear). Una transacción bloquea el registro, revalida la cuenta/rol y el estado, bloquea el borrador y verifica su versión antes de insertar/actualizar. Dos creaciones o ediciones concurrentes permiten un único guardado; la otra recibe 409 sin perder el texto local.

Guardar cambia solo la versión propia del borrador; no altera el estado, la versión principal ni la publicación. Si otra acción cambia la versión del registro antes del guardado, se requiere recargar. El formulario conserva sus versiones base mientras se edita; no adopta automáticamente versiones de otra revisora con texto local antiguo. El resultado del propio guardado actualiza la versión base. Se bloquean acciones mientras se guarda y refresca.

## Interfaz

Panel «Borrador de alerta», campos «Título de alerta» y «Texto de alerta», acción «Guardar borrador». Cuando hay resumen vigente, acción «Usar resumen de IA» rellena solo el texto y registra su procedencia; no guarda ni modifica el título. Antes de reemplazar texto escrito se pide confirmación. Los cambios posteriores son humanos y editables.

Mostrar editora/fecha cuando exista un borrador guardado. No añadir instrucciones redundantes, estados ficticios, botones de envío, publicación ni exportación. Usar componentes y estilos existentes, etiquetas accesibles, errores concretos y diseño móvil.

## Verificación y secuencia

1. Revisar el diseño y preservar los cambios existentes.
2. Añadir migración 008, contrato estricto, lectura de base IA y servicio transaccional con permisos.
3. Añadir endpoint privado y formulario integrado en el detalle; no exponerlo a participantes.
4. Pruebas de contratos y migración, E2E de guardado/edición/persistencia, uso de resumen con edición, procedencia inválida, estados/roles/origen/versiones, concurrencia y conservación del catálogo y seguimiento cerrado.
5. TypeScript, Docker, pruebas PostgreSQL y recorridos completos con proveedor simulado. Verificar teclado/móvil y privacidad. Actualizar documentos y entorno local después de pasar las comprobaciones.

Generación nueva de texto de alerta por API, múltiples alertas por caso, historial de revisiones completo, circulación institucional y aprobación/difusión de alertas quedan fuera de este incremento. No se declara completa la fase 3 respecto de capacidades de generación todavía pendientes.
