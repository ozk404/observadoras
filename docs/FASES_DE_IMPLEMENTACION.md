# FASES_DE_IMPLEMENTACION.md — Plan incremental para Codex

**Estado vigente:** consultar `ESTADO_ACTUAL.md`. Las actualizaciones por incremento que siguen conservan su contexto histórico; las posteriores sustituyen sus pendientes ya resueltos.

## Propósito y límites

Este archivo contiene **fases de construcción**, no fases de facturación ni nuevas entregas contractuales. Codex debe avanzar sobre el **repositorio existente**, sin elegir stack por cuenta propia antes de inspeccionarlo.

**Contexto temporal:** el equipo fijó como objetivo una primera prueba institucional para el **23 o 24 de octubre de 2026**. Esas fechas ya transcurrieron al redactar este archivo (25 de octubre). **No asumir** que la prueba ocurrió o que el piloto ya funciona: verificar el estado real del repositorio y del proyecto.

La currícula señala sesiones formativas el **27 y 29 de octubre**, encuentro presencial el **31 de octubre** y presentación institucional el **30 de noviembre**. No convertir esas fechas en garantías de software completo ni modificar obligaciones contractuales.

## Fase 0 — Diagnóstico del código existente

**Objetivo:** conocer el estado real antes de modificar.

**Tareas:**
- Inspeccionar estructura, instrucciones, rutas, componentes, modelo de datos, autenticación y pruebas existentes.
- Comparar lo que **funciona** con `PROJECT.md` y `FLUJOS_Y_DATOS.md`.
- Identificar posibles riesgos de permisos, datos sensibles y llamadas a IA.
- Señalar dependencias, servicios o credenciales que falten **sin solicitarlas ni escribirlas en el repositorio**.
- Presentar el siguiente incremento viable; no reescribir ni migrar por preferencia personal.

**Criterio de salida:** diagnóstico con tabla **Implementado / Parcial / Ausente / Riesgo** y propuesta de una tarea pequeña. No cambiar código en esta fase salvo solicitud explícita.

## Fase 1 — Núcleo de registro seguro

**Ampliación acordada con el usuario (25-10-2026):** incluir frontend e index básico con ADN visual; accesos Registrar denuncia y Ver denuncias; recepción pública sin cuenta; catálogo público; revisión humana básica y publicación explícita de una versión depurada independiente del original. Conservar acceso cerrado, borradores privados, envío a revisión, listado y detalle restringidos. Recorrido adicional de aceptación: envío público → revisión autorizada → redacción pública separada → confirmación de publicación → catálogo. Verificar que ninguna consulta pública expone el original y que participantes no pueden publicar. La IA sigue en fase 2; fase 3 amplía revisión y seguimiento.

**Objetivo:** que la plataforma sea útil **sin IA**.

**Alcance:** acceso autorizado, permisos mínimos, formulario estructurado, borrador, envío a revisión, listado y detalle restringidos, edición permitida según rol, validaciones claras.

**Criterios de aceptación:**
- Crear/guardar/recuperar un registro ficticio.
- No acceder ni editar registros ajenos con un rol sin permiso.
- El flujo continúa con IA desactivada.
- Se distinguen borradores de registros enviados.
- Los formularios son navegables por teclado y utilizables en móvil.

**No incluir:** reportes avanzados, gestión de evidencias sensibles, integraciones no aprobadas.

## Fase 2 — Procesamiento asistido por IA

**Estado local (25-10-2026):** integración con OpenAI implementada y verificada con proveedor simulado en Compose aislado. Ver `FASE2-DISENO.md` y `FASE2-VERIFICACION.md`. Queda pendiente configurar clave/modelo y comprobar una llamada real con datos ficticios. D-07 aún no autoriza tratamiento institucional de datos reales. La preparación y las sugerencias se separan del original y de la publicación; la decisión humana se conserva.

**Actualización posterior:** el usuario configuró credenciales y `gpt-4o-mini`. Se recreó el contenedor y se comprobó una llamada real del adaptador con texto ficticio: HTTP 200, esquema válido y sin identificadores comunes detectados. La puerta de conexión del adaptador queda verificada; no se usaron denuncias, no hubo escrituras en base de datos y D-07 sigue pendiente para datos reales.

**Incremento verificado el 26-10-2026:** las nuevas denuncias públicas declaradas ficticias encolan automáticamente el análisis de descripción y captura. La revisora consulta pertinencia preliminar, categorías, observaciones y faltantes; guarda su clasificación y observación por separado al validar. Hay cola persistente, recuperación de trabajos, reintentos acotados y descarte de respuestas obsoletas. Se verificaron 23 pruebas, 17 recorridos de navegador y una llamada real con imagen sintética. Ver `IA-INICIAL-DISENO.md` y `IA-INICIAL-VERIFICACION.md`. No se analizan registros históricos ni se habilitan datos reales; evaluación de calidad y taxonomía institucional siguen pendientes.

**Objetivo:** obtener sugerencias útiles **sin automatizar decisiones**.

**Alcance:** protección previa de datos, clasificación sugerida, resumen interno, posibles patrones si hay información suficiente y riesgo preliminar solo con criterios aprobados.

**Criterios de aceptación:**
- No transmitir datos identificables sin depuración adecuada y autorización de tratamiento.
- Señalar claramente “sugerencia de IA”.
- Mostrar estados comprensibles ante error o indisponibilidad del modelo.
- Nunca modificar una clasificación humana validada de forma automática.
- Omitir sugerencia de riesgo si no existen criterios institucionales definidos.

**No incluir:** verificación automática de veracidad, vigilancia de redes, predicción de peligrosidad.

## Fase 3 — Revisión humana, seguimiento y borradores

**Incremento 1 autorizado e implementado:** validación interna independiente. Pendiente → Validado internamente → Publicado; validar conserva privacidad y atribuye persona/fecha/evento. La publicación exige esa validación previa y confirmaciones separadas. Ver `FASE3-VALIDACION-DISENO.md` y `FASE3-VALIDACION-VERIFICACION.md`. La conexión real de OpenAI se verificó posteriormente con material ficticio, como consta en fase 2. Ajustes, cierre, seguimiento y alertas no forman parte de este primer incremento.

**Incremento 2 — Ajustes internos:** autorizado e implementado el recorrido Pendiente → Requiere ajustes → Pendiente para registros con autora interna. Observación y confirmación de revisora, guardado de avances por la autora, reenvío e historial privado atribuible; los envíos sin cuenta quedan excluidos. Sugerencias anteriores a la devolución se conservan como no vigentes. Ver `FASE3-AJUSTES-DISENO.md` y `FASE3-AJUSTES-VERIFICACION.md`. Cierre, seguimiento ampliado y alertas siguen pendientes. La conexión real con OpenAI ya fue comprobada por separado con texto ficticio; este incremento se verificó sin llamadas reales.

**Objetivo:** completar el flujo del equipo del observatorio.

**Incremento 3 — Seguimiento y cierre privado (26-10-2026):** implementado para revisoras sobre registros validados o publicados, incluidos envíos sin cuenta. Notas y cierre con motivo, persona/fecha e historial privado; cierre separado del estado principal y conservación de la publicación según confirmación del usuario. Bloqueo de nuevas notas tras cierre, control de versión y concurrencia. No incluye reapertura ni notificaciones. Ver `superpowers/specs/2026-10-26-followup-design.md` y `FASE3-SEGUIMIENTO-VERIFICACION.md`. Se verificaron 24 pruebas y 20 recorridos de navegador. Borradores de alertas siguen pendientes; no se declara completa toda la fase 3.

**Incremento 4 — Borrador interno de alerta (26-10-2026):** implementado un borrador por registro validado/publicado, exclusivo de revisoras. Redacción manual o uso explícito de resumen IA existente como base editable, con procedencia comprobada, versión propia y atribución. Guardar no modifica el original ni publica; funciona con seguimiento cerrado. Ver `superpowers/specs/2026-10-26-alert-draft-design.md` y `FASE3-ALERTAS-VERIFICACION.md`. Se verificaron 25 pruebas de servidor y 24 recorridos de navegador. La generación remota de alertas nuevas y su circulación/aprobación institucional quedan pendientes; no se declara implementada esa generación.

**Incremento 5 — Generación asistida de alertas (26-10-2026):** implementada y actualizada en localhost. Revisoras solicitan una propuesta privada mediante texto preparado y confirmado ficticio; la revisan, aplican, editan y guardan explícitamente. Sin adjuntar originales, captura, URL ni notas. Permisos, cuotas, vencimiento y versiones comprobados antes y después de la llamada; procedencia conservada tras ediciones humanas. Se verificaron 29 pruebas de servidor con PostgreSQL y 28 recorridos de navegador, sin omisiones. Ver `superpowers/specs/2026-10-26-alert-generation-design.md` y `FASE3-GENERACION-VERIFICACION.md`. La circulación/aprobación institucional, datos reales y dashboard siguen pendientes; no se declara terminada toda la fase 3.

**Alcance:** cola de revisión, corrección de sugerencias, validación humana atribuible, estados de seguimiento y generación o redacción manual de **borradores** de alerta.

**Criterios de aceptación:**
- Solo rol autorizado puede validar/cerrar según permisos.
- Guardar la acción humana con fecha e identidad interna de la persona revisora.
- Alertas permanecen en borrador; sin publicación, correo, denuncia ni derivación automáticos.
- Operaciones son coherentes con los estados aprobados.

## Fase 4 — Dashboard mínimo

**Primer incremento implementado y verificado (26-10-2026):** resumen exclusivo de revisoras con total de reportes validados/publicados, barras y tabla por clasificación humana o estado, y filtro por fecha de validación (30/90/365 días o todo el período). No lee ni expone originales, notas, imágenes o identificadores. Sin dimensiones institucionales inventadas. Se verificaron 32 pruebas de servidor y 31 recorridos completos. Ver `superpowers/specs/2026-10-26-dashboard-design.md` y `FASE4-DASHBOARD-VERIFICACION.md`. Otras dimensiones y filtros adicionales se evaluarán con campos/criterios aprobados.

**Objetivo:** visualizar resultados sin construir una suite analítica.

**Alcance:** contador general, un gráfico de barras con dimensión elegible, tabla resumida y filtros por período/categoría, usando datos agregados.

**Criterios de aceptación:**
- Los indicadores corresponden a registros reales/fixtures; nunca usar estadísticas inventadas.
- No aparecen nombres, teléfonos, usuarios ni combinaciones que identifiquen a personas.
- Categorías disponibles coinciden con campos aprobados y tienen estado “sin datos” cuando corresponda.
- No se requiere servidor independiente solo para el dashboard si no está justificado por el sistema existente.

## Fase 5 — Pruebas, correcciones y transferencia

**Objetivo:** verificar el piloto y preparar documentación para su uso institucional.

**Alcance:** pruebas de los flujos de extremo a extremo, control de permisos, escenarios de IA fallida, privacidad, usabilidad móvil, documentación de acceso, consulta y actualizaciones básicas.

**Criterios de aceptación:**
- Casos T-01 a T-10 de `FLUJOS_Y_DATOS.md` revisados.
- Problemas bloqueantes resueltos o identificados explícitamente.
- Manual breve o instrucciones para roles institucionales.
- Inventario de pendientes y limitaciones, sin declarar terminadas funciones incompletas.

## Protocolo de cada incremento Codex

1. **Antes:** describir objetivo concreto, archivos afectables, riesgo y forma de verificación.
2. **Durante:** cambiar solo el alcance acordado; preservar código útil y estilo existente; agregar pruebas donde sea viable.
3. **Después:** informar qué funciona, comandos de comprobación, pruebas ejecutadas, cuestiones pendientes y decisiones que requieren autorización.
4. **Si surge un vacío:** consultar `DECISIONES_PENDIENTES.md`; aplicar la opción más conservadora que no exponga información y dejarla documentada, sin inventar una política institucional.

## Priorización para demostraciones

Para mostrar avances, usar **cuentas y registros ficticios**. La demostración no debe depender de un servicio de IA activo ni incluir información real de participantes. Preferir un recorrido corto que funcione de extremo a extremo a múltiples pantallas sin comportamiento verificable.

## Cambio transversal — reportes y consentimiento (26-10-2026)

Por autorización del usuario, se retira la declaración obligatoria de contenido ficticio y se adopta «reporte». El modo operativo `consented` admite contenido real con aceptación explícita del procesamiento de descripción y captura por OpenAI. Migración 010: consentimiento nuevo con fecha y versión del aviso, sin reautorizar trabajos históricos. Rutas públicas `/reportar` y `/reportes`, con redirecciones anteriores. La verificación técnica usa únicamente datos ficticios y proveedor simulado. Ver `REPORTES-REALES-VERIFICACION.md`.
