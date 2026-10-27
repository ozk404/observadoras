# PROJECT.md — Definición funcional del producto

## 0. Naturaleza de este documento

**Corrección posterior de registro público, autorizada por el usuario:** `/denuncia` solicita captura obligatoria, URL opcional y descripción. No exige título manual. La imagen y la URL son evidencia privada; solo la versión textual aprobada se publica. Registros anteriores y formularios internos se conservan. Ver `EVIDENCIA-DISENO.md`. Esta decisión no sustituye las definiciones institucionales pendientes de conservación ni habilita uso de datos reales.

**Actualización acordada con el usuario (25-10-2026):** se parte de estos Markdown, sin código previo. Se añade recepción pública en `/denuncia`, sin cuenta, y catálogo público de versiones expresamente revisadas y aprobadas por una persona autorizada. El original permanece privado. Esta decisión sustituye la exclusión anterior de un portal público solo para esas versiones revisadas; no habilita consulta pública de originales ni publicación automática. La fase 1 incorpora revisión/publicación manual básica; IA por APIs en fase 2. Ver `FASE1-DISENO.md`. No se atribuye esta ampliación a los documentos contractuales originales.

Especificación **funcional y sin stack tecnológico**. Describe el producto que se busca construir; no afirma que esté desarrollado ni convierte decisiones pendientes en acuerdos con la Fundación.

**Nombre de trabajo:** Observadoras Digitales — Plataforma de Monitoreo Ciudadano.  
**Cliente institucional:** Fundación Oxlajuj No’j.  
**Marco:** Programa Paridad 2026.

## 1. Problema y propósito

El equipo del observatorio necesita un lugar único donde las personas autorizadas documenten hallazgos sobre violencia política digital, desinformación y barreras a la participación política de las mujeres. Hoy el producto requerido no es rastrear Internet de manera automática, sino **ordenar y analizar registros aportados por personas** con ayuda limitada de IA.

**Resultado esperado del piloto:** una persona autorizada puede crear un hallazgo; el equipo puede revisarlo y corregir sugerencias de IA; una vez consolidado, el sistema permite seguimiento y consulta agregada en un dashboard sencillo.

## 2. Principios innegociables

1. **Humano responsable:** toda clasificación, sugerencia de riesgo y alerta generada por IA es preliminar hasta revisión explícita de una persona autorizada.
2. **Privacidad por defecto:** recopilar lo mínimo, restringir acceso, no exponer datos identificables en el dashboard y depurar contenido antes de enviarlo a un servicio de IA.
3. **Registro antes que automatización:** la plataforma debe ser útil incluso si la IA está desactivada o falla.
4. **Piloto acotado:** sin analítica avanzada, infraestructura adicional no justificada ni nuevas funciones fuera de lo aprobado.
5. **Separación de estados:** distinguir contenido ingresado, sugerido por IA y validado por humanos.
6. **Identidad institucional:** aplicar `ADN_VISUAL.md` sin inventar activos gráficos.

## 3. Usuarios contemplados

Los diagramas UML identifican estos actores, pero la matriz precisa de acceso debe ser confirmada:

- **Participante autorizada:** registra y consulta información dentro de los permisos asignados.
- **Equipo del observatorio:** revisa, corrige, valida y hace seguimiento de hallazgos.
- **Administración:** gestiona accesos y configuración imprescindible.

La distribución provisional de permisos se describe en `FLUJOS_Y_DATOS.md`. No debe habilitarse visibilidad global a participantes por defecto.

## 4. Funcionalidades dentro del alcance

| ID | Funcionalidad | Comportamiento mínimo verificable |
|---|---|---|
| F-01 | Acceso autorizado | Solo cuentas habilitadas acceden al área privada y a operaciones permitidas por su rol. |
| F-02 | Registro estructurado | Formulario que permite crear un hallazgo, guardar un borrador y consultar su detalle. |
| F-03 | Listado y seguimiento | Cada usuario autorizado ve solo los registros que puede consultar y su estado. |
| F-04 | Detección de datos sensibles | El sistema identifica o advierte posibles datos identificables antes del procesamiento con IA; requiere confirmación humana cuando proceda. |
| F-05 | Clasificación asistida por IA | Sugiere una categoría a partir de contenido apto para procesar, sin reemplazar una decisión humana. |
| F-06 | Resumen interno y patrones posibles | Genera un resumen y, cuando existan datos suficientes, observaciones orientativas sobre patrones; no declara hechos verificados automáticamente. |
| F-07 | Riesgo preliminar | Sugiere nivel de riesgo únicamente con criterios definidos/aprobados; siempre editable y revisable. |
| F-08 | Revisión humana | Una persona autorizada puede aprobar, corregir o devolver el registro, diferenciando sugerencias de resultados verificados. |
| F-09 | Borrador de alerta ciudadana | Genera texto editable, no partidista y no revictimizante; **nunca publica ni envía** por sí mismo. |
| F-10 | Dashboard mínimo | Un contador, un gráfico de barras configurable, una tabla agregada y filtros básicos. |
| F-11 | Transferibilidad básica | Instrucciones de uso, acceso institucional y procedimiento razonable de actualización/consulta. |

### Alcance específico del dashboard (F-10)

Debe permitir consultar las dimensiones citadas en el TDR **sin construir un gráfico por dimensión**: cantidad de registros; tipo de violencia/barrera; territorio; población afectada agregada; plataforma/espacio; nivel de riesgo; acción sugerida/activada; institución competente; estado de seguimiento; tendencias; y hallazgos priorizados. La disponibilidad de cada dimensión dependerá de campos y categorías institucionalmente definidos.

Diseño visual mínimo: **(1)** total de registros, **(2)** barras según dimensión seleccionada, **(3)** tabla agregada para distribuciones, tendencias y hallazgos priorizados. Filtros sencillos por período y categoría. Sin visualización de casos identificables.

## 5. Recorrido funcional de extremo a extremo

1. La persona inicia sesión según su autorización.
2. Registra una situación mediante campos estructurados; puede dejarla en borrador.
3. Antes de usar IA, el sistema aplica controles de protección y prepara contenido adecuado; si no puede depurarlo con seguridad, evita el envío a IA y solicita revisión.
4. La IA, cuando esté disponible, propone categoría, resumen, posibles patrones y riesgo preliminar (este último solo con criterios aprobados).
5. La persona revisora examina hechos y contexto, modifica sugerencias y deja constancia de una decisión humana.
6. Se puede preparar un **borrador** de alerta para revisión, sin difusión automática.
7. Se actualizan los estados de seguimiento y se produce una vista agregada/anonimizada para el dashboard.

El detalle de actores, estados, datos y pantallas está en `FLUJOS_Y_DATOS.md`.

## 6. Reglas de negocio fundamentales

- **RB-01:** una sugerencia de IA no pasa a “validada” por un proceso automático.
- **RB-02:** una alerta generada nunca se difunde de forma automática.
- **RB-03:** un participante no puede consultar casos de terceros sin permiso expreso.
- **RB-04:** el dashboard no revela nombres, teléfonos, correos, usuarios, enlaces identificables o combinaciones de pocos datos que faciliten la reidentificación.
- **RB-05:** no se usa información real de participantes para pruebas sin consentimiento y controles apropiados; preferir registros ficticios.
- **RB-06:** la ausencia de IA no impide registrar, revisar o seguir casos manualmente.
- **RB-07:** los casos, categorías y riesgos institucionales no se inventan como verdades oficiales; donde falten reglas, la configuración se mantiene provisional.
- **RB-08:** cambios de estado y validaciones se atribuyen a una persona autorizada; conservar al menos quién y cuándo dentro del registro restringido.
- **RB-09:** toda operación de lectura/escritura comprueba permisos en el sistema, no únicamente en la interfaz.

## 7. Pantallas funcionales mínimas

1. **Ingreso:** acceso de usuarios autorizados y mensaje claro si no tienen permiso.
2. **Listado de hallazgos:** registros visibles según rol, búsqueda/filtros básicos y estado.
3. **Nuevo/editar hallazgo:** campos pertinentes, errores comprensibles, guardado de borrador.
4. **Detalle de hallazgo:** datos permitidos, sugerencias de IA diferenciadas, seguimiento.
5. **Revisión:** validar/corregir/devolver según permisos; elaboración de borrador de alerta.
6. **Dashboard:** tres bloques mínimos; acceso restringido.
7. **Administración mínima:** control de accesos, sin crear un sistema administrativo complejo.

No es necesario que cada función sea una ruta o pantalla separada.

## 8. Fuera de alcance explícito

- Rastreo, scraping o vigilancia automatizada de redes sociales.
- Verificación autónoma y concluyente de noticias, deepfakes o identidad de personas.
- Denuncias legales, derivaciones institucionales o publicación automática de alertas.
- Aplicación móvil nativa; sistema público de consulta de casos; chat/social feed.
- Geolocalización precisa o mapas avanzados de personas afectadas.
- Machine learning predictivo, puntuación automática definitiva o reconocimiento de personas.
- Dashboards múltiples, BI avanzado, exportación masiva de datos sensibles.
- Nuevos compromisos de mantenimiento, alojamiento o servicios ajenos a lo acordado.

## 9. Requisitos no funcionales verificables

- **Seguridad:** permisos reales, prevención de acceso cruzado, tratamiento restringido de información; secretos fuera del repositorio.
- **Privacidad:** contenido enviado a IA depurado y conforme a las reglas de uso autorizadas; datos agregados anonimizados en dashboard.
- **Usabilidad:** flujo entendible sin capacitación técnica; mensajes concretos; errores recuperables.
- **Accesibilidad:** navegación por teclado, controles etiquetados, contraste suficiente, interfaz adaptable a móvil y escritorio.
- **Confiabilidad:** guardar datos y revisar casos no depende de disponibilidad de IA.
- **Transferencia:** documentación básica para usar la herramienta y administrar accesos.

## 10. Condiciones de éxito del piloto

- Se puede crear y recuperar un hallazgo con datos ficticios.
- Las personas solo acceden a lo que sus permisos permiten.
- Se pueden revisar/corregir sugerencias de IA y registrar la intervención humana.
- La IA no es necesaria para completar manualmente el proceso.
- No hay publicación ni envíos automáticos de alertas.
- El dashboard muestra solo resultados agregados y no identificables.
- Existen pruebas básicas de permisos, estados, privacidad y fallos de IA.
- El equipo puede seguir instrucciones de uso sin depender permanentemente de la persona desarrolladora.

## 11. Fuentes y trazabilidad

- TDR: secciones 3.3, 3.4, 4, 5, 11 y 12.
- Producto 1 aprobado: capítulos 4, 5 y 6.
- UML compartidos: actores, componentes y secuencia de registro → análisis → revisión → dashboard; tratados como diseño orientativo.
- Currícula: sesiones 6 y 7, únicamente para coherencia entre herramienta y ejercicios formativos.

> Las especificaciones detalladas de roles, campos, estados, prioridad y manejo de evidencias son propuestas de implementación. Las decisiones no determinadas por las fuentes aparecen en `DECISIONES_PENDIENTES.md`.

**Incremento autorizado 26-10-2026:** nuevas denuncias públicas declaradas ficticias reciben análisis automático de descripción y captura. La revisora ve categorías, pertinencia, observaciones y faltantes. Cola persistente y campos de decisión humana separados. No se certifica verdad, no se analizan registros previos ni se publica automáticamente. Ver `IA-INICIAL-DISENO.md`.

**Actualización autorizada 26-10-2026:** la interfaz adopta «reporte». Se retira el requisito de contenido ficticio y el usuario autoriza descripción y captura reales para OpenAI con consentimiento explícito, fecha y versión del aviso. Rutas `/reportar` y `/reportes`, con redirecciones de enlaces anteriores. Originales privados y publicación humana independiente. No se reinterpretan consentimientos históricos; las pruebas técnicas siguen usando fixtures ficticios. Ver `superpowers/specs/2026-10-26-real-reports-design.md`.


## Imágenes públicas aprobadas (27-10-2026)

La publicación admite una imagen opcional, preparada fuera de la plataforma y autorizada expresamente por una revisora. En una ficha publicada, «Imagen pública» permite añadir, reemplazar o retirar esa copia. El catálogo muestra una miniatura y el detalle permite ampliarla conservando sus proporciones. Los reportes anteriores no reciben imágenes automáticamente.

La copia tiene almacenamiento, identificador y aprobación separados del original privado. Requiere descripción y confirmación de privacidad/autorización; el consentimiento de análisis con IA no autoriza publicación. Se normaliza a WebP sin metadatos, con límites de 5 MiB y 20 megapíxeles. Reemplazar o retirar invalida la URL anterior; las copias descargadas por terceros no se pueden recuperar. No se incluye un editor de ocultamiento de datos.

La migración 012 es aditiva. La primera imagen se guarda atómicamente con la publicación; los cambios posteriores usan versión propia y auditoría, sin modificar el original ni la versión del reporte. Ver `docs/superpowers/specs/2026-10-27-public-images-design.md`.
