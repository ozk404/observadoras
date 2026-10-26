# DECISIONES_PENDIENTES.md — Supuestos y validaciones

## Estado de decisiones

Este archivo distingue **lo decidido por las fuentes** de lo que debe confirmarse. No retrasar el desarrollo de las funciones ya aprobadas por cuestiones cosméticas; sí bloquear cualquier decisión que pudiera exponer información sensible o imponer un criterio institucional no acordado.

| ID | Pregunta pendiente | Responsable de confirmar | Tratamiento prudente mientras tanto |
|---|---|---|---|
| D-01 | ¿Qué perfiles exactos y permisos tendrá cada uno? | Fundación / equipo del observatorio | Mínimo privilegio; participantes solo sus registros; validación solo para revisores. |
| D-02 | ¿Existe una ficha institucional oficial de registro? ¿Cuáles campos son obligatorios? | Fundación | Usar campos mínimos del TDR; no inventar una ficha definitiva. |
| D-03 | ¿Cuál es la taxonomía oficial de tipos de violencia/barreras? ¿Permite varias categorías? | Fundación | Mantener ejemplos del TDR como provisionales y configurables. |
| D-04 | ¿Cómo se calculan/describen los niveles de riesgo? | Fundación | No asignar automáticamente niveles si la escala no está aprobada. |
| D-05 | ¿Cuáles son los estados oficiales y quién puede cerrarlos? | Fundación | Propuesta simple del documento de flujos, no considerarla política definitiva. |
| D-06 | Captura privada obligatoria y URL opcional autorizadas para `/reportar`. ¿Conservación y condiciones institucionales definitivas? | Fundación / usuario | PNG/JPEG/WebP hasta 5 MiB, normalizada y privada. El usuario autorizó descripción y captura reales para OpenAI con consentimiento explícito registrado; sin publicación de la imagen ni envío de URL. Conservación y condiciones operativas institucionales siguen pendientes. |
| D-07 | Alcance técnico autorizado; ¿qué condiciones institucionales de conservación, derechos y operación faltan? | Fundación / responsables de protección de datos | OpenAI puede analizar descripción y captura de nuevos reportes con consentimiento, fecha y versión del aviso. Texto preparado por revisoras requiere revisión de privacidad. No reinterpretar autorizaciones históricas ni afirmar anonimato. |
| D-08 | ¿El dashboard incluye registros pendientes o solo validados? ¿Quién puede verlo? | Fundación | Indicar claramente la población contada; usar agregados validados como base de visualizaciones sensibles. |
| D-09 | ¿Qué criterios de agrupación evitan reidentificación en subconjuntos pequeños? | Fundación | No exponer desgloses inseguros; posponer filtros que revelen personas. |
| D-10 | ¿Habrá alta de cuentas por invitación u otro mecanismo? | Fundación | Acceso cerrado, administrado por persona autorizada; sin registro público. |
| D-11 | ¿Cuáles son los activos oficiales de identidad (logo vectorial, tipografía)? | Fundación | Aplicar color `#69088B`; dejar marcador neutro para logos no proporcionados. |
| D-12 | ¿Cuál es el estado real del desarrollo y se realizó la prueba prevista del 23–24 de octubre? | Equipo técnico | Auditar código y registrar evidencia; no afirmar completitud por cronograma. |
| D-13 | ¿Dónde vivirá el piloto y quién administra credenciales, respaldos y acceso al terminar? | Fundación / consultoría según contrato | Diseñar para transferencia; no contratar ni asumir servicios nuevos. |

## Decisiones ya sustentadas

### Acuerdos de esta conversación — 25 de octubre de 2026

Confirmados por el usuario; no se atribuyen a aprobación institucional contractual:

- D-12, estado técnico: solo estaban disponibles los siete Markdown; no existe código previo. La realización de pruebas del 23–24 sigue sin evidencia.
- Base técnica: Next.js + TypeScript + PostgreSQL en Docker Compose. IA futura mediante APIs externas desde el servidor; sin modelos propios ni backend Python separado.
- Fase 2 autorizada: proveedor OpenAI elegido por el usuario. Modelo y clave se configuran en el entorno del servidor, sin valores institucionales inventados. D-07 se resuelve solo respecto del proveedor; condiciones de tratamiento de datos reales siguen pendientes. La implementación exige modo de pruebas ficticias y confirmación humana del texto preparado. D-03 (taxonomía) y D-04 (riesgo) continúan abiertas; las categorías se presentan como ejemplos orientativos y no se calcula riesgo.
- Por indicación del usuario se deja pendiente la conexión real con OpenAI y se avanza al primer incremento de fase 3: validación interna independiente de publicación. Flujo autorizado para este incremento: pendiente → validado internamente → publicado. Solo revisores habilitados, con confirmación explícita, usuario/fecha y control de versión. Validar no publica. Para publicaciones anteriores se conserva la revisión real documentada en su publicación, con procedencia diferenciada, sin inventar una validación histórica separada. El resto de D-05 (ajustes, cierre y seguimiento) continúa pendiente.
- Recepción abierta sin cuenta en `/denuncia`; originales privados, pendientes de revisión.
- Catálogo público solo con versión independiente revisada y aprobada explícitamente por una persona autorizada. Esto reemplaza la exclusión previa de catálogo público; no autoriza publicar originales.
- Fase 1 incluye frontend/index, flujo autenticado y recepción → revisión/publicación manual básica → catálogo. IA en fase 2 y revisión ampliada en fase 3.
- D-01/D-10 para este incremento: cuentas cerradas provisionadas operativamente; participantes solo sus registros; revisores acceden a envíos, no a borradores ajenos, y pueden publicar. La matriz institucional completa permanece pendiente.
- D-02: formulario mínimo provisional de título y descripción, sin contacto ni archivos; no equivale a ficha institucional definitiva.
- Fase 3, incremento 2 autorizado: solicitar ajustes solo en registros internos pendientes, con observación privada, confirmación, versión y revisora/fecha; la autora guarda correcciones y reenvía a pendiente. Se conserva historial de solicitudes y reenvíos. Los envíos sin cuenta quedan excluidos, sin inventar canal de contacto. Ajustes de registros validados/publicados, cierre, notificaciones y alertas siguen fuera del incremento. Las sugerencias previas a una devolución se conservan como no vigentes y no se reutilizan para publicación.
- Pendientes antes de datos reales: conservación, canal institucional de derechos, condiciones de publicación/retirada, alojamiento, HTTPS y respaldos. No se declara anonimización automática ni autorización institucional para datos reales.

- Solo se implementa una **plataforma piloto**, con IA como apoyo y revisión humana.
- Dashboard **básico**, integrado y con información agregada y anonimizada.
- No publicar alertas o acusaciones automáticamente.
- El programa formativo asigna a la consultoría únicamente sesiones **6 y 7**.
- El color institucional principal proporcionado es **`#69088B`**.

## Cómo resolver una decisión

Registrar para cada decisión cerrada: fecha, persona/equipo que validó, opción elegida, efecto sobre las pantallas y documentación afectada. Evitar atribuir acuerdos a la Fundación sin confirmación.

- 26-10-2026: el usuario autoriza análisis inicial automático de descripción y captura para orientar a la revisora. Ver `IA-INICIAL-DISENO.md`. Continúa el modo ficticio; D-07 no se resuelve para datos reales. Categorías y pertinencia son preliminares, sin decisiones automáticas.
- 26-10-2026: seguimiento privado para revisoras sobre registros validados o publicados, con notas y cierre manual atribuible. El usuario confirmó que cerrar conserva la publicación: termina solo el seguimiento. Se mantienen separados los estados principales; no hay reapertura, retirada, alertas ni notificaciones en este incremento. D-05 se resuelve solo para este flujo local, sin atribuir una política definitiva a la Fundación. Ver `superpowers/specs/2026-10-26-followup-design.md`.
- 26-10-2026: incremento de borrador interno de alerta por registro validado/publicado. Redacción manual o uso explícito de resumen IA existente como base editable; versión propia y procedencia comprobada. Exclusivo de revisoras, también con seguimiento cerrado. No hay llamadas nuevas para generar alertas, aprobación, envío, publicación ni derivación. Esa generación y circulación institucional siguen pendientes. Ver `superpowers/specs/2026-10-26-alert-draft-design.md`.
- 26-10-2026, incremento posterior: generación explícita de propuestas de alerta con OpenAI sobre texto preparado y confirmado ficticio por la revisora. Propuesta privada separada; aplicar y guardar son acciones humanas distintas. No adjuntar automáticamente original, captura, URL o notas. D-07 sigue sin habilitar datos reales; aprobación y circulación institucional siguen pendientes. Ver `superpowers/specs/2026-10-26-alert-generation-design.md`.

## Actualización autorizada — 26-10-2026

El usuario autoriza retirar el requisito ficticio y recibir reportes reales, incluido el análisis automático de descripción y captura con OpenAI mediante consentimiento explícito. Se adopta «reporte» para distinguir el envío de una denuncia penal. La aceptación se registra con fecha y versión del aviso; los registros históricos no se reautorizan ni procesan retroactivamente. D-06/D-07 quedan ampliadas técnicamente por esta autorización del usuario, sin atribuir aprobación institucional a la Fundación. Conservación, canal de derechos, retirada, alojamiento, HTTPS y respaldos continúan pendientes y no se inventan valores. Pruebas y demos técnicas siguen usando datos ficticios. Ver `superpowers/specs/2026-10-26-real-reports-design.md`.
