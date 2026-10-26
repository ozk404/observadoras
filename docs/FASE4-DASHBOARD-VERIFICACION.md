# Dashboard mínimo privado — verificación 26-10-2026

Primer incremento autorizado tras consolidar el repositorio. Diseño: `superpowers/specs/2026-10-26-dashboard-design.md`, revisado y guardado en `ab000e8`. Consolidación anterior en `dacd3c3`, sin secretos ni datos de base; `ESTADO_ACTUAL.md` distingue estado vigente de hitos históricos.

## Implementación

- `/equipo/dashboard`, acceso mediante «Resumen» solo para revisoras. `/api/privado/dashboard` exige sesión de revisora habilitada y no usa caché. Participantes reciben 403 en API y no ven datos en la página; visitantes deben iniciar sesión.
- Tres bloques: total de reportes validados, barras horizontales y tabla agregada. Incluye estados validados/publicados, sin contar dos veces la publicación. Filtro por fecha de validación: 30/90/365 días o todo el período; agrupación por clasificación humana o estado.
- Consulta SQL parametrizada con una instantánea para autorización, total y distribución. No lee títulos, descripciones, imágenes, URL, notas ni análisis de IA. Revalida cuenta habilitada en la misma consulta.
- Clasificación humana exclusivamente: deduplicación por reporte/categoría, tratamiento de categorías vacías o desconocidas como sin clasificación, porcentajes sobre el total de reportes y nota breve sobre categorías múltiples. Los valores desconocidos, campos extra y filtros repetidos se rechazan sin presentar agregados.
- Formulario GET, aplicar/restablecer reales, tabla semántica y barras con cantidades textuales. No hay nuevas dependencias de runtime, tablas, migraciones ni llamadas externas.

## Comprobaciones

- `npx next typegen`, `npm run typecheck` y `git diff --check`: salida 0.
- `docker compose build app`: salida 0; compilación, TypeScript y exportación correctos. Imagen final `f7e3e5c738bb`.
- Entorno aislado `observadoras-dashboard-test` con `compose.ai-test.yaml`, base nueva y proveedor simulado. Sin información personal real ni llamadas a OpenAI.
- `docker compose -p observadoras-dashboard-test -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app sh -c 'node --import tsx --test --test-concurrency=1 tests/*.test.ts'`: salida 0, **32/32 aprobadas, ninguna omitida**. Las pruebas nuevas comprueban períodos inclusive en el límite exacto de 30 días y fuera por un microsegundo, fechas futuras, duplicados, categorías desconocidas, varios estados, exclusión de sugerencias IA, acceso de cuenta deshabilitada y resultado vacío. Los fixtures del cálculo usan un esquema temporal en transacción revertida.
- `node scripts/test-e2e.mjs`, con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-dashboard-test` y `TEST_AI=true`: ejecución final salida 0, **31/31 recorridos**. Incluye controles, restablecimiento, filtros inválidos/duplicados, separación de originales, acceso visitante/participante, tabla/barras coincidentes, teclado y móvil.
- La primera ejecución específica comprobó también cero real y estado vacío; detectó un selector que retenía el valor anterior al restablecer por navegación cliente. Se corrigió remontando el formulario al cambiar filtros. Se acotó el selector de error de prueba para no confundirlo con el anunciador de rutas accesible de Next.js.
- La primera suite completa llegó al límite de diez accesos de la cuenta ficticia revisora compartida: se verificaron doce intentos y el mensaje de límite. Se creó una cuenta de prueba dedicada al dashboard, sin modificar límites de producción. Antes de repetir se limpiaron solo contadores del proyecto aislado, tras comprobar su modo simulado y origen; la suite final pasó y deshabilitó sus once cuentas.
- Capturas finales `artifacts/dashboard-desktop.png` y `artifacts/dashboard-mobile.png` inspeccionadas. Móvil de 390 px sin desbordamiento. Datos ficticios y capturas ignoradas por Git.

## Actualización local

`docker compose up -d --no-build`: salida 0. Aplicación y PostgreSQL saludables, worker activo. Salud HTTP 200; API de resumen sin sesión HTTP 401; página privada sin sesión HTTP 307 a ingreso.

Conteos conservados antes/después: 2 cuentas habilitadas, 4 reportes, 1 publicación, 3 imágenes, 0 eventos de seguimiento, 0 borradores de alerta y 0 generaciones. No se modificaron datos existentes para probar el dashboard. El entorno aislado se detuvo conservando su volumen.

## Límites

Solo agregados privados para revisoras. No incorpora cruces demográficos, dimensiones institucionales sin campos aprobados, descarga ni vista pública. D-08 resuelta técnicamente por autorización del usuario; D-09 institucional permanece pendiente y no se promete anonimización. Riesgo, taxonomía oficial, conservación, derechos, respaldos y transferencia institucional siguen pendientes según `DECISIONES_PENDIENTES.md`.
