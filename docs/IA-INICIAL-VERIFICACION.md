# Verificación de análisis inicial con captura — 26-10-2026

Incremento: nuevas denuncias públicas declaradas ficticias reciben análisis automático de descripción y captura. El resultado es privado para revisores; la clasificación humana se guarda por separado. No hay aprobación, rechazo ni publicación automática. No se procesan registros históricos.

## Comprobaciones ejecutadas

- `npm run typecheck`: salida 0.
- `docker compose build app`: salida 0 con compilación de Next.js y TypeScript. La instalación inicial omitió el binario nativo al fallar su descarga; se acotaron reintentos/tiempos, se incluyeron dependencias opcionales y se verificó el binario de la arquitectura y Sharp antes de construir.
- `docker compose -p observadoras-intake-test -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app npm test`: salida 0; **23/23 pruebas**, ninguna omitida. Incluye migraciones sin análisis retroactivo y recuperación de lease vencido con reclamación concurrente sin duplicar resultado.
- `node scripts/test-e2e.mjs` con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-intake-test`, `TEST_AI=true`: salida 0; **17/17 recorridos**. Incluye análisis sin acción manual, permisos visitante/participante/revisor, selección humana desde la interfaz, conservación ante fallo, dos intentos, bloqueo previo de identificadores y descarte de respuestas posteriores a validación. Los recorridos anteriores de ajustes, publicación y análisis manual siguen pasando. Las cuentas ficticias se deshabilitan al terminar.
- Inspección visual de escritorio y móvil de 390 px, sin desbordamiento horizontal. Capturas locales ignoradas por Git en `artifacts/intake-reviewer.png` y `artifacts/intake-reviewer-mobile.png`.
- Una llamada real a OpenAI con descripción y una imagen creada expresamente como fixture sintético, sin consultar denuncias ni escribir registros. Respuesta multimodal aceptada, esquema válido, pertinencia y categorías devueltas, notas de captura presentes y tres observaciones; sin señales de identificadores en la salida. No demuestra precisión general ni capacidad de verificar hechos.

La prueba de navegador detectó inicialmente una consulta antes de completar la navegación al registro. Se corrigió la espera explícita de URL y se repitió la ejecución completa sobre la imagen final.

## Entorno local actualizado

`docker compose up -d --no-build`: salida 0. App y PostgreSQL saludables; worker en ejecución y `/api/health` devuelve 200. Se conservaron los conteos anteriores: dos cuentas habilitadas, dos registros, una evidencia y ninguna publicación. La cola inicial queda vacía: ningún registro histórico se transmitió. El entorno aislado se detuvo con `down`, conservando su volumen; las pruebas no modificaron las cuentas del entorno principal.

## Límites

Continúa exclusivamente `AI_DATA_MODE=synthetic`, con declaración de descripción y captura ficticias. El consentimiento no certifica anonimización y `store:false` no equivale a retención cero del proveedor. Las condiciones institucionales para datos reales y la taxonomía definitiva siguen pendientes. Las sugerencias son preliminares y la revisora conserva la decisión. Las URL no se consultan ni se envían; imagen, original y evaluación no aparecen automáticamente en el catálogo.
