# FLUJOS_Y_DATOS.md — Especificación funcional operativa

## 0. Convenciones

**Ampliación autorizada por el usuario (25-10-2026):** además de cuentas cerradas, una persona visitante puede enviar título y descripción desde `/denuncia`. No puede consultar originales ni revisar/publicar. El catálogo `/denuncias` consulta exclusivamente versiones públicas separadas y aprobadas expresamente por el rol revisor. Recepción → pendiente; publicación manual → versión pública con persona/fecha. La fase 1 usa estos estados mínimos y mantiene borradores de autoría interna privados. No hay IA ni publicación automática. Ver `FASE1-DISENO.md` para la delimitación frente a las propuestas siguientes.

- **Requisito confirmado:** funcionalidad que aparece en TDR/Producto 1.
- **Propuesta de implementación:** solución recomendada, aún no aprobada como regla institucional.
- **Pendiente:** decisión que necesita confirmación o inspección del sistema actual. Ver `DECISIONES_PENDIENTES.md`.

Este documento **no** especifica frameworks, motores de datos ni proveedores de IA.

## 1. Actores y permisos propuestos

Los UML contemplan **Participante**, **Equipo del Observatorio** y **Administración**. El TDR exige accesos restringidos pero no define una matriz detallada.

| Operación | Participante | Equipo observatorio | Administración |
|---|---|---|---|
| Crear hallazgo | Sí | Si se habilita | Según configuración |
| Consultar propios hallazgos | Sí | Sí | Según necesidad institucional |
| Consultar hallazgos de otras personas | No, por defecto | Sí, según asignación | Solo por función autorizada |
| Editar borrador propio | Sí | Según permisos | No es requisito general |
| Revisar/corregir sugerencias IA | No por defecto | Sí | Solo si también tiene rol revisor |
| Validar registros | No | Sí | Solo si también tiene rol revisor |
| Generar/revisar borrador de alerta | No por defecto | Sí | Solo si también tiene rol revisor |
| Ver dashboard agregado | Pendiente | Sí | Sí, si autorizado |
| Administrar accesos | No | No por defecto | Sí |

**Regla de protección provisional:** mínimo privilegio y aislamiento entre personas participantes. Los permisos deben validarse en el servidor o mecanismo equivalente, no únicamente ocultando botones.

## 2. Pantallas / vistas mínimas

### V-01. Acceso
- Autenticar a una cuenta habilitada.
- Informar errores de acceso sin revelar información de otros usuarios.
- Redirigir a áreas disponibles según rol.

### V-02. Mis hallazgos / Registros
- Listado limitado por permisos.
- Presentar identificador interno, título breve, categoría (si existe), fecha y estado.
- Filtro sencillo por estado y búsqueda si es necesaria.
- Acción **Nuevo hallazgo** para quienes pueden registrar.

### V-03. Nuevo/editar hallazgo
- Campos estructurados del punto 4.
- Validaciones claras y acción **Guardar borrador**.
- Acción **Enviar a revisión** cuando se cumpla el mínimo requerido.
- Advertir sobre datos sensibles antes de análisis externo con IA.

### V-04. Detalle del hallazgo
- Información visible acorde al rol.
- Estado y seguimiento.
- Sugerencias de IA visualmente separadas de decisiones humanas.
- Acciones permitidas según estado y rol.

### V-05. Revisión
- Cola de registros pendientes.
- Verificar información, corregir clasificación y riesgo, validar o solicitar correcciones.
- Mantener constancia mínima de persona revisora y fecha/hora.
- Preparar borrador de alerta opcional, editable, sin envío automático.

### V-06. Dashboard
- Contador de registros; gráfico de barras según dimensión; tabla agregada.
- Filtros mínimos por período/dimensión.
- No mostrar registros identificables ni texto sin depurar.

### V-07. Administración mínima
- Habilitar/deshabilitar cuentas y asignar permisos necesarios.
- No diseñar una suite de gestión organizacional.

## 3. Estados de un hallazgo (propuesta inicial)

Estos nombres no están prescritos por el TDR y requieren validación antes de convertirse en reglas inmutables:

```text
Borrador → Pendiente de revisión → En revisión → Validado → Cerrado
                                 └──────→ Requiere ajustes → Pendiente de revisión
```

- **Borrador:** la persona autora aún no envía el registro.
- **Pendiente de revisión:** registro enviado, todavía no validado.
- **En revisión:** una persona autorizada está evaluando el registro.
- **Requiere ajustes:** se solicita completar o corregir información.
- **Validado:** revisión humana finalizada para uso institucional definido.
- **Cerrado:** seguimiento concluido por decisión del equipo.

**Restricciones:** un sistema de IA nunca ejecuta la transición a **Validado** ni **Cerrado**. La transición requiere una acción humana autorizada. No inferir que “Validado” significa hecho judicialmente acreditado.

## 4. Datos funcionales del hallazgo

Los siguientes son **campos lógicos propuestos** para implementar el registro mínimo. No equivalen a la ficha institucional definitiva.

| Campo lógico | Necesidad | Consideración |
|---|---|---|
| Identificador interno | Necesario | Generado por el sistema; no incluir datos personales. |
| Título breve | Propuesto | Descripción corta no identificable. |
| Descripción del hecho | Necesario para el análisis | Puede contener datos sensibles; proteger, minimizar y depurar antes de IA. |
| Fecha de situación / registro | Propuesto | Distinguir fecha del hecho y fecha de carga cuando sean diferentes. |
| Tipo de violencia o barrera | TDR | Según categorías institucionales aprobadas; IA solo sugiere. |
| Territorio o departamento | TDR | Evitar precisión territorial que identifique a alguien. |
| Población afectada (agregada) | TDR | Solo categorías amplias autorizadas; no perfiles identificables. |
| Plataforma o espacio | TDR | Ej. tipo de red o entorno; no exigir usuario/URL identificable. |
| Nivel de riesgo | TDR | Criterios y escala deben ser aprobados. |
| Acción sugerida/activada | TDR | Campo/etiqueta institucional, sin activar acciones automáticamente. |
| Institución competente/destinataria | TDR | Selección definida por equipo institucional. |
| Estado de seguimiento | TDR | Gestionado por personas autorizadas. |
| Hallazgo priorizado | TDR | Marcador de priorización definido por equipo humano. |
| Resumen interno IA | TDR | Guardar separado del texto revisado; no considerarlo validado. |
| Clasificación sugerida IA | TDR | Separada de la categoría final revisada. |
| Riesgo sugerido IA | TDR | Separado de valoración humana final. |
| Borrador de alerta | TDR | Texto editable y con estado propio, nunca publicación automática. |
| Autor y revisor internos | Propuesta de control | Solo en área restringida; jamás en resultados públicos/agregados. |
| Fechas de acciones y validaciones | Propuesta de control | Trazabilidad mínima, no historial forense avanzado. |

**Pendiente de confirmación:** campos obligatorios, listas cerradas, categorías, escala de riesgos, referencias a evidencias y conservación de registros. Estas decisiones dependen de los formatos institucionales disponibles.

### Categorías iniciales de referencia

El TDR menciona como ejemplos: **acoso, amenaza, desinformación, discurso de odio, desprestigio, doxing, suplantación, manipulación electoral y violencia política digital**. No asumir que estas categorías son mutuamente excluyentes o exhaustivas sin validación.

### Evidencias y archivos

El programa formativo menciona capturas, enlaces, fechas y contexto al enseñar documentación segura, pero el TDR del piloto **no exige explícitamente un gestor completo de evidencias adjuntas**. No habilitar cargas de capturas/archivos ni almacenar URLs personales como parte obligatoria del MVP sin reglas aprobadas de privacidad, acceso y conservación. Un campo de referencia restringido es una decisión pendiente, no una funcionalidad comprometida.

## 5. Flujo A — Crear hallazgo

1. La persona autorizada accede a **Nuevo hallazgo**.
2. Completa campos permitidos, con ayuda para evitar nombres, contactos y detalles identificables innecesarios.
3. Puede **Guardar borrador** y retomar después.
4. Al **Enviar a revisión**, se verifican campos imprescindibles.
5. El estado cambia a **Pendiente de revisión** y solo los roles autorizados pueden examinarlo.
6. Si falla el análisis con IA, el registro y su estado **se conservan**; no se pierde trabajo.

**Criterios de aceptación:** una persona no puede editar registros ajenos sin permiso; errores muestran qué campo requiere corrección; el guardado no necesita IA.

## 6. Flujo B — Protección y análisis con IA

1. Comprobar que la operación está autorizada y que el contenido puede procesarse.
2. Detectar/advertir datos sensibles; **depurar antes de enviar a un modelo o servicio externo**.
3. Si no es seguro depurar, no enviar la información y solicitar intervención humana.
4. Solicitar únicamente las tareas permitidas: categoría preliminar, resumen, posibles patrones y nivel de riesgo **solo si existe escala aprobada**.
5. Mostrar resultados marcados como **Sugerencia de IA — pendiente de revisión**.
6. Permitir corrección humana; no sobrescribir las decisiones revisadas con nuevos resultados automáticos.

**Criterios de aceptación:** simulando un registro con datos identificables, el sistema no los incluye en la solicitud externa; si la IA falla, existe continuación manual; ninguna sugerencia valida automáticamente el hallazgo.

> La IA no establece por sí misma la veracidad, autoría, delito, intención, riesgo definitivo ni identidad de personas.

## 7. Flujo C — Revisión humana y seguimiento

1. El equipo abre un hallazgo pendiente según sus permisos.
2. Lee información contextual y sugerencias (si existen).
3. Corrige/acepta los campos que correspondan, usando los criterios de la Fundación.
4. Marca una decisión humana: **Validado** o **Requiere ajustes**.
5. Registra estado de seguimiento y, cuando proceda, la priorización.
6. Puede cerrar el seguimiento, de acuerdo con las reglas institucionales.

**Criterios de aceptación:** queda explícito quién validó y cuándo; un usuario sin rol revisor no puede validar; las sugerencias se distinguen del resultado revisado.

## 8. Flujo D — Borrador de alerta ciudadana

1. Una persona revisora autorizada solicita un borrador sobre información adecuada y revisada.
2. El sistema prepara un texto claro, cuidadoso, no partidista y no revictimizante.
3. La persona edita y revisa afirmaciones, anonimización y tono.
4. El borrador queda asociado al hallazgo como **borrador interno**.
5. **No** existe botón de publicación automática ni envío institucional automático en el piloto.

**Criterios de aceptación:** el borrador no se difunde; si la IA no está disponible puede redactarse manualmente; no se generan acusaciones categóricas sin verificación humana.

## 9. Flujo E — Dashboard mínimo

Fuente: **registros consolidados** de la plataforma. Convención propuesta para evitar confundir hechos no revisados: contador total puede incluir todos los registros autorizados con etiqueta clara; las distribuciones de hallazgos y tendencias se basan en registros **validados**. Confirmar con la Fundación.

Tres elementos de interfaz:

1. **Contador general:** número de registros, con etiqueta precisa del conjunto contado.
2. **Gráfico de barras configurable:** una dimensión seleccionada a la vez.
3. **Tabla agregada:** distribución, tendencia por período y prioridades, sin revelar casos individuales.

Dimensiones a cubrir cuando existan los datos: categoría; territorio; población agregada; espacio/plataforma; riesgo; acción; institución; estado; tendencia temporal; prioridad; total. Puede haber dimensiones con la anotación **sin datos**; no generar ni inventar cifras.

**Seguridad:** no permitir agrupaciones o filtros que faciliten la reidentificación de personas. Definir con la institución criterios de supresión/agrupación antes de mostrar conjuntos demasiado pequeños; no prometer un umbral universal sin su validación.

## 10. Casos de prueba de negocio (mínimos)

| ID | Escenario | Resultado esperado |
|---|---|---|
| T-01 | Participante intenta abrir registro de otra participante | Acceso rechazado. |
| T-02 | Guardar borrador con IA fuera de servicio | Registro guardado. |
| T-03 | Registro con teléfono/identificador se propone para IA | No se transmite dato identificable sin depuración adecuada. |
| T-04 | IA recomienda riesgo alto | No hay aprobación ni alerta automática. |
| T-05 | Persona no revisora intenta validar | Operación rechazada. |
| T-06 | Revisor corrige sugerencia de IA | Decisión humana conservada y distinguible. |
| T-07 | Solicitud de alerta sin publicación | Solo crea borrador interno. |
| T-08 | Dashboard recibe registros de prueba con nombres | No revela nombres ni filas individualizables. |
| T-09 | Dimensión no tiene datos | Mensaje de ausencia de datos, no valores inventados. |
| T-10 | Formulario en móvil y teclado | Campos y acciones alcanzables y comprensibles. |

## 11. Decisiones no resueltas

Antes de cerrar reglas de negocio permanentes, confirmar con Fundación: matriz de roles, ficha oficial, taxonomía, escala de riesgo, evidencias, estados de seguimiento, visibilidad del dashboard, criterios de agregación/anonimización y condiciones para usar servicios externos de IA. Ver `DECISIONES_PENDIENTES.md`.
