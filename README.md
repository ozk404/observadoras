# Observadoras Digitales

Next.js, TypeScript, PostgreSQL y Docker Compose. Fase 1: recepción pública, borradores privados y publicación humana de una versión independiente. IA mediante OpenAI: análisis automático de descripción y captura para nuevos reportes públicos con consentimiento explícito, y preparación manual para borradores internos. Requiere configuración del servidor.

## Arranque local

Requisitos: Docker Engine con Compose; Node 22 para generar la configuración local. En la primera instalación, construir la imagen una vez con `docker compose -f compose.yaml build app`.

```powershell
node scripts/setup-env.mjs
node scripts/dev.mjs up
docker compose ps
```

Abre http://localhost:3000. Es el único entorno de trabajo visible: `compose.override.yaml` monta el código y activa recarga automática, sin reconstruir por cada edición. Las cuentas, reportes y configuración OpenAI de `.env` se conservan. Para una entrega empaquetada se omite el override explícitamente: `docker compose -f compose.yaml up -d --build`. La migración se ejecuta antes de arrancar la aplicación y puede repetirse. PostgreSQL no publica puertos; sus datos están en un volumen. El puerto de la app se enlaza a localhost. No ejecutar `down -v` si necesitas conservar información.

`.env` contiene secretos aleatorios locales y no se versiona. `DATABASE_URL` apunta al servicio `db`. Revisa `.env.example`. Antes de exponer por HTTPS, establece `APP_ORIGIN` al origen exacto público y `COOKIE_SECURE=true`. Define el proxy/TLS y respaldos con la institución; Compose local no es una certificación de despliegue seguro.

## Cuentas cerradas

Contraseñas de 14–128 caracteres por stdin; no se pasan como argumentos ni hay cuentas predeterminadas. En PowerShell:

```powershell
$credential = Get-Credential -UserName revisora
$credential.GetNetworkCredential().Password | docker compose exec -T app npm run user -- create revisora reviewer "Nombre completo"
Remove-Variable credential
docker compose exec -T app npm run user -- disable revisora
```

La gestión web está en `/equipo/usuarios`, reservada al permiso `can_manage_users`, independiente del rol de revisión. Permite crear cuentas revisoras con nombre obligatorio, editar nombres, activar/desactivar, conceder administración y restablecer contraseñas; conserva las cuentas participantes antiguas. No hay registro público ni envío de claves por correo. Desactivar, restablecer contraseña o cambiar el permiso administrativo revoca sesiones. No se permite auto-desactivarse, retirarse administración ni restablecer la propia contraseña desde el panel. Se conserva al menos una persona administradora activa.

La habilitación inicial es una operación explícita; ningún username concede privilegios automáticamente:

```powershell
docker compose exec -T app npm run user -- grant-admin USUARIO
docker compose exec -T app npm run user -- set-name USUARIO "Nombre completo"
```

Para recuperación operativa de una cuenta, usa `Get-Credential` y pasa la nueva clave por stdin a `npm run user -- reset-password USUARIO`. Nunca como argumento. Esta operación también revoca sesiones y deja auditoría. Las claves nuevas requieren 14–128 caracteres. Las cuentas anteriores sin nombre se muestran como pendientes hasta completarlo; no se inventan identidades. El historial registra actor, destinatario, origen operativo/web y campos modificados; no registra contraseñas ni hashes.

## Recorridos

- `/`: index inicial.

- `/reportar`: envío sin cuenta con **captura obligatoria, URL opcional y descripción**; original y evidencia privados. No solicita título manual; genera una referencia interna. Se reconoce el aviso antes del envío.

- `/reportes`: catálogo de versiones aprobadas; detalle mediante identificador público independiente.

- `/ingreso`, `/equipo`: acceso cerrado, listado restringido, nuevos borradores y detalle.

- Una participante guarda y retoma sus borradores; al enviar dejan de ser editables.

- Una revisora lee pendientes y puede **Validar sin publicar**. La confirmación registra usuario, fecha y evento; el original permanece privado. Después puede redactar título/texto públicos separados. Dos confirmaciones públicas y confirmación final preceden la publicación atribuida y transaccional.

- Flujo actual: **Pendiente → Validado internamente → Publicado**. La validación interna no acredita judicialmente los hechos ni obliga a publicar. Revisar no depende de OpenAI. La autora puede consultar la validación de su propio registro; no se expone en el catálogo.

- En registros internos pendientes, la revisora también puede **Devolver para ajustes** con una observación privada y confirmación explícita. La autora ve qué corregir, puede **Guardar correcciones** sin cambiar el estado y **Reenviar a revisión** cuando complete los campos mínimos. Se conserva la observación, persona/fecha y reenvío de cada ciclo; el detalle muestra las 10 solicitudes más recientes. Una sola solicitud puede estar abierta por registro.

- Flujo adicional: **Pendiente → Requiere ajustes → Pendiente**. Solo la autora edita; mientras espera ajustes no puede validarse ni publicarse. No se devuelven registros validados/publicados ni envíos sin cuenta. No se envían correos ni se inventa un contacto para denuncias públicas.

- Migración 004: historial de ajustes y marca de obsolescencia de sugerencias IA. Las sugerencias anteriores a la devolución siguen privadas, señaladas como no vigentes y sin acción de llevarlas al borrador público. Las respuestas en curso se descartan por estado/versión y marca de obsolescencia. No se transmite ninguna observación automáticamente a OpenAI.

- Migración 003: publicaciones anteriores conservan su revisión humana real como `legacy_publication`; la interfaz la identifica como revisión registrada al publicar. No se inventan eventos de validación anteriores. Si un estado publicado no tiene publicación atribuible, la migración falla sin inventar datos y debe investigarse.

Las sesiones opacas duran 8 horas; solo se guarda su hash. Deshabilitar cuenta invalida su acceso. Las contraseñas usan scrypt con sal individual. No se guardan cuerpos privados en logs de aplicación. El catálogo no consulta originales ni identidades internas.

## Límites contra abuso

Solicitudes JSON de hasta 26 KB; contenido hasta 6000 caracteres. Se valida Origin exacto para mutaciones. Formulario público con campo trampa y token firmado válido entre 1,5 segundos y una hora. Clave de envío evita duplicados al reintentar. Límites de seguridad provisionales: 120 envíos globales/10 minutos, 30 por origen técnico/10 minutos y 3 por token/hora. Login: 60 por origen técnico y 10 por usuario/15 minutos. PostgreSQL aplica contadores atómicos entre procesos.

`TRUST_PROXY=false` agrupa conexiones en un límite compartido seguro. Solo actívalo si un proxy confiable sobrescribe `X-Real-IP` y bloquea acceso directo a la app. Estos controles son una base, no una garantía contra ataques distribuidos; ajustar con evidencia antes de recepción institucional. Limpia periódicamente sesiones y contadores caducados:

```powershell
docker compose exec -T app npx tsx scripts/cleanup.ts
```

## Desarrollo y verificación

Para iterar sin reconstruir imágenes:

```powershell
node scripts/dev.mjs up
node scripts/dev.mjs ui
```

Abre http://localhost:3100: datos ficticios, base propia, recarga automática y OpenAI simulado. La versión empaquetada permanece en 3000. Ver [Desarrollo y validación](docs/DESARROLLO_Y_VALIDACION.md) para pruebas proporcionales, perfiles de cuentas, worker de prueba y build final. No ejecutar pruebas con datos reales ni contra la base principal.

## Organización

`src/app`: rutas y handlers. `src/components`: componentes y formularios. `src/server`: autorización, seguridad, reglas de registros y consultas parametrizadas. `db/migrations`: SQL versionado. `scripts`: operación. `tests`: pruebas. No se requiere un ORM para este esquema; las migraciones SQL son transaccionales y se serializan mediante advisory lock.

## Pendientes institucionales

La ficha definitiva, matriz completa de permisos, conservación, canal de derechos, procedimiento de retirada pública, activos oficiales, alojamiento y respaldos siguen pendientes. El usuario autorizó recepción y análisis de reportes reales el 26-10-2026; esto no resuelve ni sustituye las decisiones institucionales operativas pendientes. Se admiten imágenes acotadas, seguimiento privado con cierre y borradores de alertas; sin archivos genéricos. El dashboard privado mínimo ya está disponible para revisoras. Consulta `docs/FASE1-DISENO.md`, `docs/FASE2-DISENO.md`, `docs/EVIDENCIA-DISENO.md` y los documentos de producto.

## Captura privada de reporte público

Una captura estática PNG/JPEG/WebP, obligatoria, de hasta 5 MiB y 20 megapíxeles. Se comprueban tamaño, firma/formato real y decodificación; se normaliza a WebP sin pérdida ni metadatos. No se guarda el nombre ni archivo original, ni se certifica autenticidad/custodia forense. La eliminación de metadatos no oculta información visible; la persona debe evitar datos personales innecesarios antes del envío. Máximo dos decodificaciones simultáneas por proceso; peticiones multipart hasta 6 MiB, conservando controles de frecuencia y origen.

La migración 005 guarda evidencia binaria en una tabla privada separada de PostgreSQL, dentro de la misma transacción de registro/evento. El volumen existente conserva datos e imagen al recrear la app. Listados y catálogo no seleccionan binarios. Los respaldos deben incluir esta tabla; revisar almacenamiento antes de uso institucional. Los reintentos con la misma clave no duplican ni reemplazan evidencia.

La imagen solo se sirve mediante endpoint autenticado con los permisos del registro y sin caché. La revisora puede verla y abrir la URL de fuente desde el detalle privado. URLs solo http/https, sin credenciales; no se consultan desde el servidor. Ni URL ni imagen se publican con la versión textual. Con consentimiento explícito, el análisis inicial envía descripción e imagen a OpenAI; la URL permanece excluida. Las denuncias previas sin imagen y el flujo de borradores internos se conservan.

## IA opcional: OpenAI

Configura únicamente en `.env` local `OPENAI_API_KEY`, `OPENAI_MODEL` (modelo de tu cuenta compatible con Responses y Structured Outputs) y `AI_DATA_MODE=consented`. No hay modelo impuesto ni clave predeterminada. No pegues secretos en el chat ni uses variables `NEXT_PUBLIC_`. Recrea la app con `docker compose up -d app` después de cambiar el entorno. La generación debe probarse con contenido ficticio antes de habilitar cualquier uso institucional.

La revisora prepara un texto aparte, depura identificadores comunes y confirma privacidad y autorización del texto preparado. Solo ese texto se envía a `https://api.openai.com/v1/responses`, sin autor, identificador interno, original, herramientas o archivos. Se usa `store:false`, salida estructurada, tiempo máximo de 25 segundos, hasta 1800 tokens de salida y respuesta limitada a 64 KB. `store:false` **no garantiza retención cero**: deben revisarse los controles y condiciones de datos del proveedor antes de autorizar información real.

Categorías orientativas y resumen se almacenan como sugerencias privadas, con persona/fecha, modelo, versión y hash del texto preparado. No se guarda otra copia de la entrada ni la respuesta cruda del proveedor. La detección no demuestra anonimización; también requiere revisión de nombres y contexto. No se calcula riesgo ni se inventan patrones entre casos a partir de un solo relato. Hasta cinco solicitudes recientes son visibles en el detalle privado. Hay límite de 10 solicitudes por revisora/hora y 60 globales/hora, una solicitud activa por registro y rechazo de resultados obsoletos. Ante fallos, el original y la publicación manual siguen disponibles.

Después de validar internamente, la acción explícita **Usar resumen como borrador público** permite editarlo; conserva el título en preparación y reinicia las confirmaciones humanas. La IA no publica ni sobrescribe versiones aprobadas. Cambiar el texto o título públicos también reinicia las confirmaciones. Validar cierra la etapa de generación de IA; una respuesta que llegue después se descarta por versión/estado.

### Prueba de integración aislada y sin consumo de API

```powershell
docker compose build app
docker compose -f compose.ai-test.yaml up -d
$env:TEST_BASE_URL = 'http://localhost:3100'
$env:TEST_COMPOSE_FILE = 'compose.ai-test.yaml'
$env:TEST_AI = 'true'
node scripts/test-e2e.mjs
docker compose -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app npm test
Remove-Item Env:TEST_BASE_URL, Env:TEST_COMPOSE_FILE, Env:TEST_AI
docker compose -f compose.ai-test.yaml down
```

El Compose de pruebas tiene PostgreSQL separado, puerto 3100, credencial ficticia y proveedor simulado etiquetado; no llama a OpenAI. Su volumen se conserva hasta eliminarlo expresamente. El endpoint alternativo solo se acepta con la combinación exacta de entorno de prueba y origen local prevista en el código; no configura destinos arbitrarios. Las pruebas comprueban la aplicación, el contrato y la recuperación ante fallos; no demuestran conectividad, calidad o disponibilidad del modelo real.

La prueba de migración usa un esquema temporal dentro de una transacción que se revierte: crea fixtures del esquema previo y comprueba conservación de publicaciones, originales y atribución, exclusión de envíos sin cuenta del estado de ajustes y unicidad de solicitudes abiertas. No modifica registros existentes. Consulta `docs/FASE3-VALIDACION-DISENO.md` y `docs/FASE3-AJUSTES-DISENO.md`. Seguimiento, cierre y borradores de alertas se implementaron posteriormente; consulta los apartados siguientes y `docs/ESTADO_ACTUAL.md`.

Documentación oficial consultada: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) y [controles de datos de OpenAI](https://platform.openai.com/docs/guides/your-data).

## Borradores de alertas

Las revisoras pueden guardar un borrador por registro validado o publicado, incluso con seguimiento cerrado. Se redacta manualmente, se usa explícitamente un resumen vigente como base o se solicita una propuesta nueva de IA sobre texto preparado. Se conserva la referencia de procedencia, creadora, última editora y fechas. Generar o usar una propuesta no guarda, envía ni publica la alerta.

La migración 008 añade la tabla privada con versión propia. El endpoint `/api/privado/registros/[id]/borrador-alerta` exige rol revisor; verifica las versiones y la pertenencia/vigencia de la referencia IA. Guardar no modifica el original, su versión principal ni el catálogo. El borrador no se expone a participantes.

La migración 009 conserva las solicitudes y propuestas privadas en `alert_generations`. En **Generar con IA**, la revisora prepara texto revisado y confirma su revisión de privacidad antes de solicitar. Responses recibe solo ese texto, con `store:false`; no adjunta original, captura, URL ni notas. Mantiene modelo configurado, cuotas compartidas de 10 solicitudes por revisora/hora y 60 globales/hora, un trabajo en curso por registro y vencimiento de dos minutos. No hay reintentos automáticos: un trabajo abandonado se recupera al pedir otra generación. La propuesta se descarta si cambia el registro, el borrador o los permisos, o si venció el trabajo. Ante fallos se conserva la alternativa manual. El modo `consented` permite contenido real autorizado; las pruebas usan únicamente fixtures ficticios.

## Seguimiento privado

En registros validados o publicados, las revisoras pueden guardar notas y cerrar el seguimiento con motivo y confirmación. Cada entrada conserva revisora y fecha. El cierre impide nuevas notas; no retira publicaciones ni altera la validación. Un registro validado con seguimiento cerrado puede publicarse mediante el flujo humano existente. Participantes y catálogo no reciben este historial. No se incluye reapertura ni notificaciones.

## Análisis inicial con captura

La migración 006 crea una cola persistente en PostgreSQL y campos separados de clasificación humana. `docker compose up -d` inicia también `ai-worker` con la misma imagen de la app. No se analizan registros históricos ni borradores internos automáticamente.

Al enviar `/reportar` se acepta el aviso y se autoriza el análisis de descripción y captura con OpenAI. La migración 010 registra consentimiento, fecha y versión del aviso desde el servidor; no atribuye consentimiento nuevo a registros anteriores. El worker envía ambas a OpenAI (imagen normalizada por datos inline, `store:false`); no envía URL, identificadores del registro ni cuentas. El modo operativo es `AI_DATA_MODE=consented`; `synthetic` solo funciona con la configuración aislada del proveedor simulado. `AI_AUTOMATIC_ENABLED=false` bloquea nuevas llamadas automáticas.

La revisora ve pertinencia preliminar, categorías orientativas, resumen, observaciones sobre la imagen, faltantes y limitaciones. No certifica veracidad, identidad ni autenticidad. La clasificación y observación humanas se guardan aparte al validar. Nada aprueba ni publica automáticamente.

La recepción no espera al proveedor. Estados visibles: en cola, procesando, completado, fallido, bloqueado o descartado por cambio de versión. Hay dos intentos como máximo por ejecución, espera de cinco segundos y recuperación de trabajos con lease vencido de noventa segundos. Un fallo no impide revisar manualmente; una revisora puede solicitar un nuevo intento explícito. El endpoint del análisis es exclusivo del rol revisor y sin caché.

## Estado consolidado

Consultar [estado actual](docs/ESTADO_ACTUAL.md) para distinguir funcionalidades vigentes, verificaciones y pendientes. Los documentos de verificación registran hitos históricos y no reemplazan ese resumen.

## Resumen privado del observatorio

Como revisora, abrir **Resumen** en el área privada (`/equipo/dashboard`). Contador, barras y tabla usan solo reportes validados/publicados, con filtro por fecha de validación y agrupación por clasificación humana o estado. Varias categorías pueden sumar más que el total. No incluye originales, identificadores ni categorías sugeridas por IA. Participantes y visitantes no acceden a los agregados. Ver `docs/FASE4-DASHBOARD-VERIFICACION.md`.


## Imágenes públicas aprobadas (27-10-2026)

La publicación admite una imagen opcional, preparada fuera de la plataforma y autorizada expresamente por una revisora. En una ficha publicada, «Imagen pública» permite añadir, reemplazar o retirar esa copia. El catálogo muestra una miniatura y el detalle permite ampliarla conservando sus proporciones. Los reportes anteriores no reciben imágenes automáticamente.

La copia tiene almacenamiento, identificador y aprobación separados del original privado. Requiere descripción y confirmación de privacidad/autorización; el consentimiento de análisis con IA no autoriza publicación. Se normaliza a WebP sin metadatos, con límites de 5 MiB y 20 megapíxeles. Reemplazar o retirar invalida la URL anterior; las copias descargadas por terceros no se pueden recuperar. No se incluye un editor de ocultamiento de datos.

La migración 012 es aditiva. La primera imagen se guarda atómicamente con la publicación; los cambios posteriores usan versión propia y auditoría, sin modificar el original ni la versión del reporte. Ver `docs/superpowers/specs/2026-10-27-public-images-design.md`.


Actualización autorizada (27-10-2026): «Incluir captura original» permite aprobar la captura existente sin descargarla ni volver a subirla, con vista previa privada, descripción y confirmación explícita. Disponible al publicar y en publicaciones existentes; «Subir otra imagen» sigue siendo alternativa. El servidor toma únicamente la evidencia del reporte autorizado y crea una copia pública independiente; no admite identificadores arbitrarios de evidencia ni cambia el original. Sustituye el requisito previo de preparar siempre un archivo externo. Sin migraciones.


Pruebas aisladas bajo demanda: `node scripts/dev.mjs test-up` (añadir `--ai` si el flujo lo necesita), ejecutar `ui`/`auth` y finalizar con `node scripts/dev.mjs test-down`. El puerto3100 es exclusivo de pruebas con datos ficticios y proveedor simulado, no una segunda página para revisar cambios.
