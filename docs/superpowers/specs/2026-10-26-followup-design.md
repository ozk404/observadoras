# Fase 3 — Seguimiento y cierre privado

## Acuerdo y alcance

El usuario autorizó continuar por fases y eligió conservar la publicación al cerrar el seguimiento. Este incremento añade notas privadas para revisoras y cierre manual con motivo, persona y fecha. No introduce reglas institucionales de priorización ni certifica resolución de los hechos.

La implementación mínima usa un historial asociado al registro. Se descarta reemplazar el estado principal por «cerrado», porque mezclaría seguimiento con revisión/publicación; también se descarta un gestor de tareas o notificaciones, fuera de este incremento.

## Comportamiento

- Solo revisoras habilitadas pueden consultar o escribir el seguimiento. Participantes y visitantes no reciben notas ni metadatos de cierre por API, detalle o catálogo.
- Notas y cierre se habilitan para registros validados o publicados, tanto internos como enviados sin cuenta. Los borradores, pendientes y registros que requieren ajustes mantienen sus flujos actuales.
- Cada nota requiere entre 10 y 2000 caracteres, versión vigente y autora/fecha obtenidas del servidor. Las notas forman un historial inmutable; no se editan ni borran desde la aplicación.
- Cerrar requiere motivo con el mismo límite, confirmación explícita y versión vigente. Se registra un evento de cierre y su autora/fecha en una transacción.
- El cierre impide nuevas notas y cierres repetidos. No se implementa reapertura en este incremento.
- Cerrar no modifica el estado principal, la validación, la evidencia, los análisis ni la versión pública. Una publicación permanece visible. Un registro validado con seguimiento cerrado conserva la posibilidad de preparar y aprobar una versión pública por el flujo humano existente.
- Notas y cierre incrementan la versión del registro. Operaciones concurrentes o páginas antiguas reciben conflicto; no se pierden cambios.
- No hay solicitudes de IA, correo, alertas ni derivaciones por estas acciones.

## Datos y componentes

Migración aditiva 007: tabla de eventos de seguimiento con registro, tipo (nota/cierre), texto, revisora y fecha; índice de historial y unicidad del cierre. Los registros anteriores arrancan sin historial, sin fabricar cierres.

El cierre se deriva del evento único: no añade un estado ni expone campos de seguimiento en la proyección general de registros. La escritura bloquea la fila del registro, verifica rol habilitado, estado y versión y consulta cierre dentro de la misma transacción. Una nueva ruta privada GET/POST comparte el servicio de permisos, control de origen, límites de cuerpo y errores existentes.

Panel «Seguimiento» en el detalle de la revisora, solo para validados/publicados. Historial con texto, autora y fecha, campo «Nota», acción «Guardar nota» y acción «Cerrar seguimiento». Al cerrar, confirmación explícita y motivo; después se muestra «Cerrado», sin formulario. Texto mínimo según ADN, etiquetas accesibles y mensajes de error concretos. No rediseñar otras áreas.

## Validación y entrega

- Esquema de entrada: límites, confirmación y rechazo de campos de actor/fecha forjados.
- Migración: preservación de originales, publicaciones, evidencias y validaciones; sin eventos retroactivos.
- E2E ficticio: registrar notas desde la interfaz, recargar, cerrar con motivo y comprobar persistencia; publicación conservada; publicación posterior de validado cerrado; permisos de visitante/participante; estados inválidos, origen ajeno, versión antigua, cierre doble y concurrencia sin duplicación; bloqueo de nuevas notas tras cierre.
- TypeScript, build Docker, pruebas de servidor con PostgreSQL y recorridos completos de navegador con proveedor simulado. Comprobar móvil y teclado del panel nuevo.
- Actualizar guía y fases, recrear servicios locales solo después de pasar pruebas y comprobar salud y conservación de datos. No procesar denuncias históricas con IA ni habilitar datos reales.

## Secuencia de trabajo

1. Revisar este diseño y mantener intactos los cambios existentes.
2. Añadir migración, contrato y servicio transaccional con permisos.
3. Integrar endpoint y panel de seguimiento.
4. Ejecutar las verificaciones y corregir fallos dentro del alcance.
5. Documentar resultados y actualizar el entorno local conservando sus datos.
