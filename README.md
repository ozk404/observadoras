# Observadoras Digitales

Next.js, TypeScript, PostgreSQL y Docker Compose. Fase 1: recepción pública, borradores privados y publicación humana de una versión independiente. Fase 2: sugerencias opcionales mediante OpenAI, desactivadas hasta configurar el servidor y limitadas a contenido ficticio.

## Arranque local

Requisitos: Docker Engine con Compose; Node 22 para generar la configuración local.

```powershell
node scripts/setup-env.mjs
docker compose up --build -d
docker compose ps
```

Abre http://localhost:3000. La migración se ejecuta antes de arrancar la aplicación y puede repetirse. PostgreSQL no publica puertos; sus datos están en un volumen. El puerto de la app se enlaza a localhost. No ejecutar `down -v` si necesitas conservar información.

`.env` contiene secretos aleatorios locales y no se versiona. `DATABASE_URL` apunta al servicio `db`. Revisa `.env.example`. Antes de exponer por HTTPS, establece `APP_ORIGIN` al origen exacto público y `COOKIE_SECURE=true`. Define el proxy/TLS y respaldos con la institución; Compose local no es una certificación de despliegue seguro.

## Cuentas cerradas

Contraseñas de 14–128 caracteres por stdin; no se pasan como argumentos ni hay cuentas predeterminadas. En PowerShell:

```powershell
$credential = Get-Credential -UserName revisora
$credential.GetNetworkCredential().Password | docker compose exec -T app npm run user -- create revisora reviewer
Remove-Variable credential
docker compose exec -T app npm run user -- disable revisora
```

Usa `participant` para cuentas que solo crean/consultan sus registros, o `reviewer` para el equipo autorizado a leer envíos y publicar. No hay rol administrativo con acceso implícito. Administrar cuentas requiere acceso operativo al contenedor.

## Recorridos

- `/`: index inicial.
- `/denuncia`: envío sin cuenta; original privado, solo título/descripción y reconocimiento del aviso.
- `/denuncias`: catálogo de versiones aprobadas; detalle mediante identificador público independiente.
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

## Verificación

```powershell
npm ci
npm run typecheck
npm test
npm run build
npx playwright install chromium
# Provisionar cuentas ficticias test-reviewer (reviewer), test-participant y test-other
# (participant), test-disabled (participant, luego disable), con la misma contraseña de prueba.
# Asignar TEST_PASSWORD solo en el entorno temporal de pruebas.
npm run test:e2e
```

También puedes ejecutar `node scripts/test-e2e.mjs` con Compose activo: provisiona cuentas ficticias con nombres y contraseña aleatorios, ejecuta Playwright y deshabilita las cuentas al terminar. Usa solo una base de pruebas; las publicaciones ficticias generadas permanecen hasta retirarlas expresamente. No hay cuentas de demostración habilitadas por defecto.

Ejecutar E2E solo en un entorno de prueba aislado: crea registros y publicaciones ficticias; nunca usa información real. Para ejecuciones repetidas, esperar el vencimiento de límites o limpiar contadores exclusivamente en esa base de pruebas. Capturas y resultados se ignoran en Git; no compartir capturas de datos reales.

## Organización

`src/app`: rutas y handlers. `src/components`: componentes y formularios. `src/server`: autorización, seguridad, reglas de registros y consultas parametrizadas. `db/migrations`: SQL versionado. `scripts`: operación. `tests`: pruebas. No se requiere un ORM para este esquema; las migraciones SQL son transaccionales y se serializan mediante advisory lock.

## Pendientes institucionales

La ficha definitiva, matriz completa de permisos, conservación, canal de derechos, procedimiento de retirada pública, activos oficiales, alojamiento y respaldos siguen pendientes. Este entorno se usa con datos ficticios hasta resolverlos. No hay adjuntos, seguimiento avanzado ni dashboard. Consulta `docs/FASE1-DISENO.md`, `docs/FASE2-DISENO.md` y los documentos de producto.

## IA opcional: OpenAI

Configura únicamente en `.env` local `OPENAI_API_KEY`, `OPENAI_MODEL` (modelo de tu cuenta compatible con Responses y Structured Outputs) y `AI_DATA_MODE=synthetic`. No hay modelo impuesto ni clave predeterminada. No pegues secretos en el chat ni uses variables `NEXT_PUBLIC_`. Recrea la app con `docker compose up -d app` después de cambiar el entorno. La generación debe probarse con contenido ficticio antes de habilitar cualquier uso institucional.

La revisora prepara un texto aparte, depura identificadores comunes y confirma privacidad y carácter ficticio. Solo ese texto se envía a `https://api.openai.com/v1/responses`, sin autor, identificador interno, original, herramientas o archivos. Se usa `store:false`, salida estructurada, tiempo máximo de 25 segundos, hasta 1800 tokens de salida y respuesta limitada a 64 KB. `store:false` **no garantiza retención cero**: deben revisarse los controles y condiciones de datos del proveedor antes de autorizar información real.

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

La prueba de migración usa un esquema temporal dentro de una transacción que se revierte: crea fixtures del esquema previo y comprueba conservación de publicaciones, originales y atribución, exclusión de envíos sin cuenta del estado de ajustes y unicidad de solicitudes abiertas. No modifica registros existentes. Consulta `docs/FASE3-VALIDACION-DISENO.md` y `docs/FASE3-AJUSTES-DISENO.md`. Cierre, seguimiento ampliado y alertas todavía no están implementados.

Documentación oficial consultada: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) y [controles de datos de OpenAI](https://platform.openai.com/docs/guides/your-data).
