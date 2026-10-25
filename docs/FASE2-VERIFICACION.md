# Fase 2 — Verificación local y puerta pendiente

## Actualización: conexión real comprobada

Tras configurar el usuario `.env`, se recreó la aplicación para cargar el entorno. Una llamada real mediante el adaptador de la aplicación a OpenAI con `gpt-4o-mini` respondió HTTP 200. La salida pasó el esquema de categorías/resumen/limitaciones y la comprobación de identificadores comunes. Se usó únicamente un relato ficticio; no se leyeron denuncias ni se escribieron registros en la base de datos. La clave no se mostró ni se incluyó en este documento.

Queda verificada la conexión real del adaptador para ese modelo. No equivale a una nueva prueba de navegador de extremo a extremo contra el proveedor real, ni autoriza datos reales. El modo continúa siendo `synthetic`. La sección siguiente conserva el resultado histórico previo a configurar credenciales.

25 de octubre de 2026. OpenAI fue elegido por el usuario. Implementación local de Responses API sin SDK adicional, con modelo y clave configurables exclusivamente en servidor. Esta verificación no acredita una llamada real ni autorización institucional de datos reales.

## Resultado

- `npm run typecheck`: código 0.
- `npm test`: código 0, 12 pruebas aprobadas.
- `docker compose build app`: código 0, compilación de producción y TypeScript aprobados.
- `docker compose config --quiet` y configuración de Compose de IA: código 0.
- Migraciones 001 y 002 aplicadas en la aplicación principal; repetición de migración en el contenedor de pruebas: código 0.
- `npm test` dentro del contenedor: código 0, 12 pruebas aprobadas.
- `node scripts/test-e2e.mjs` con `TEST_AI=true`, `TEST_BASE_URL=http://localhost:3100` y `TEST_COMPOSE_FILE=compose.ai-test.yaml`: código 0, **7 escenarios aprobados**, sin omisiones. Cuatro corresponden a regresión de fase 1 y tres a IA.
- Capturas de revisión asistida en escritorio y móvil inspeccionadas; sin desbordamiento a 390 px.
- Aplicación principal y PostgreSQL saludables en `localhost:3000`. Base principal sin registros, publicaciones ni análisis ficticios del entorno de integración.

## Comportamientos comprobados

Detección y depuración local de identificadores comunes; rechazo en servidor antes de crear solicitudes con señales; confirmaciones de revisión y datos ficticios obligatorias; participantes sin acceso a análisis; texto preparado inicialmente vacío; original con correo ficticio conservado en privado y no incluido en la entrada del proveedor; sugerencias persistentes y diferenciadas; solicitud estructurada con `store:false`; manejo de rechazo, JSON inválido, esquema inválido, cuerpo excesivo, error del proveedor y timeout.

El uso explícito del resumen conserva el título público en preparación y reinicia confirmaciones. El texto editado por una persona es el que se publica; el resultado IA se conserva separado. Después de publicar se puede consultar la sugerencia, pero no regenerarla ni sobrescribir la publicación.

En concurrencia, una solicitud obtiene resultado y la simultánea es rechazada. Una respuesta que llega después de publicar se descarta. El fallo del proveedor no impide completar manualmente la publicación.

En PostgreSQL de pruebas se comprobaron cinco análisis: dos exitosos y tres fallidos (`unavailable`, `invalid_response`, `stale`); ninguno quedó en ejecución. Las cuatro cuentas ficticias quedaron deshabilitadas. El Compose de pruebas se detuvo conservando su volumen aislado para trazabilidad. No se usó la API real, no se configuró una clave real ni se enviaron datos a OpenAI.

## Archivos principales

- `src/server/openai.ts`: contrato HTTP, tiempo/cuerpo máximos y validación de respuestas.
- `src/server/analyses.ts`: permisos, concurrencia, persistencia, límites y descarte por versión/estado.
- `src/lib/privacy.ts`, `src/lib/ai-contract.ts`: detección orientativa y esquemas compartidos.
- `src/components/ai-review.tsx`: preparación, estados y sugerencias; `private-forms.tsx`: reutilización explícita y confirmaciones.
- `src/app/api/privado/registros/[id]/analisis/route.ts` y detalle privado: conexión con el recorrido existente.
- `db/migrations/002_ai_analyses.sql`: almacenamiento separado, sin duplicar el texto preparado.
- `.env.example`, `scripts/setup-env.mjs`, Compose de prueba, documentación y pruebas.

## Qué falta

**Puerta de conexión real:** definir `OPENAI_API_KEY`, `OPENAI_MODEL` compatible con Responses/Structured Outputs y `AI_DATA_MODE=synthetic` en el entorno local, recrear la aplicación y ejecutar una prueba con texto ficticio. No se afirma disponibilidad, acceso de cuenta, costo o calidad de un modelo sin esa prueba. No compartir claves por chat.

**Puerta institucional D-07:** condiciones de tratamiento, retención y autorización de datos reales. La detección por reglas no garantiza anonimización. `store:false` no garantiza retención cero del proveedor. Solo se habilita modo ficticio con confirmación humana.

Taxonomía definitiva y escala de riesgo continúan pendientes. No se solicita riesgo; no se infieren patrones entre registros con una sola entrada. Revisión/seguimiento ampliados y dashboard siguen en fases posteriores. La siguiente fase requiere indicación expresa.
