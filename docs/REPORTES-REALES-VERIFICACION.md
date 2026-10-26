# Reportes y contenido real — verificación 26-10-2026

El usuario aprobó «reporte», retirar la declaración obligatoria de contenido ficticio y analizar descripción y captura reales mediante OpenAI con consentimiento explícito. No se atribuye esta autorización técnica a la Fundación ni se inventan plazos de conservación o canales de derechos.

## Cambios

- Interfaz pública y privada: «Enviar un reporte», «Reportes revisados», «Reporte recibido» y «Captura o imagen». Se conserva una aclaración contextual en el formulario: el envío informa al observatorio y no presenta una denuncia penal. ADN y documentación actualizados.
- Rutas `/reportar`, `/reportes`, `/reportes/[id]`. Redirecciones permanentes 308 desde las rutas anteriores, conservando identificadores y paginación. La API mantiene sus rutas para limitar regresiones.
- Eliminada la casilla ficticia y `syntheticConfirmed` de los contratos actuales. Una aceptación pública obligatoria explica el procesamiento por OpenAI. El texto preparado para IA requiere confirmación de privacidad; no se adjuntan originales automáticamente a esas solicitudes.
- Migración 010 aditiva: consentimiento de análisis inicial con fecha y versión del aviso asignada en servidor. Los campos históricos se conservan como tales: no se convierten en consentimiento nuevo. Ejecución y reintentos exigen aceptación válida. No hay procesamiento retroactivo.
- `AI_DATA_MODE=consented` permite operación real autorizada; `synthetic` solo habilita el proveedor simulado con su configuración aislada exacta. Se mantienen controles de identificadores en texto y resultados, cuotas, permisos, URL excluida, originales privados y publicación humana independiente. La normalización de imágenes no elimina identificadores visibles ni garantiza anonimato.

## Comprobaciones

- Diseño revisado y guardado en commit `037d742`.
- `npx next typegen` y `npm run typecheck`: salida 0. Tras mover las rutas, la primera comprobación detectó tipos generados antiguos; regenerarlos resolvió esas referencias.
- Pruebas locales en serie: 30 totales, 26 aprobadas y 4 de base omitidas; salida 0.
- `docker compose build app`: salida 0. Imagen final `5757933a4319`, incluyendo últimos ajustes de «imagen» en textos y etiquetas accesibles.
- Entorno nuevo `observadoras-real-reports-test` con `compose.ai-test.yaml`: PostgreSQL aislado, puerto 3100 y proveedor simulado. Sin llamadas reales ni datos personales en las pruebas.
- `docker compose -p observadoras-real-reports-test -f compose.ai-test.yaml exec -T -e TEST_DATABASE_MIGRATIONS=true app sh -c 'node --import tsx --test --test-concurrency=1 tests/*.test.ts'`: salida 0; **30/30 aprobadas, ninguna omitida**. Incluye persistencia del consentimiento nuevo, versión/fecha asignadas, rechazo de trabajos y reintentos históricos, migración conservando declaraciones anteriores sin reinterpretarlas y modos de configuración.
- `node scripts/test-e2e.mjs`, con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-real-reports-test` y `TEST_AI=true`: salida 0; **29/29 recorridos**. Comprueba consentimiento, lenguaje, rutas, formularios, privacidad, fallos, concurrencia y flujos anteriores.
- Después de los últimos ajustes de texto y etiquetas de imagen, se recreó el entorno con la imagen final y se ejecutaron los recorridos afectados: `node scripts/test-e2e.mjs evidence.spec.ts phase-one.spec.ts report-language.spec.ts`: salida 0; **7/7 aprobados**. Las cuentas ficticias de ambas ejecuciones se deshabilitaron al finalizar.
- Capturas finales `artifacts/reportar-evidencia-mobile.png` y `artifacts/reportar-evidencia-desktop.png` inspeccionadas. Vista de 390 px sin desbordamiento; navegación por teclado comprobada. Capturas ignoradas por Git y con datos ficticios.
- `git diff --check`: salida 0.

## Actualización local

`docker compose up -d --no-build`: salida 0, migración 010 aplicada. Configuración comprobada mediante valores no secretos: modo `consented`, IA lista y simulación desactivada; clave y modelo conservados. No se efectuó ninguna llamada real para esta verificación.

Salud HTTP 200; `/reportar` y `/reportes` HTTP 200; `/denuncia` redirige a `/reportar` y `/denuncias?pagina=2` a `/reportes?pagina=2` mediante 308. Análisis privado sin sesión HTTP 401.

Conteos antes y después: 2 cuentas habilitadas, 4 reportes, 1 publicación, 3 imágenes, 2 trabajos de análisis inicial, 0 borradores de alerta y 0 generaciones. Los trabajos históricos tienen 0 consentimientos nuevos. No se borraron registros de demostración ni se alteraron originales existentes. El entorno aislado se detuvo conservando su volumen.

## Pendientes que no resuelve este cambio

Conservación, canal institucional de derechos, retirada de publicaciones, alojamiento público, HTTPS y respaldos requieren definición operativa. No se atribuye aprobación institucional ni despliegue público. Pruebas y demos técnicas continúan usando datos ficticios; la IA sigue siendo auxiliar y no certifica veracidad ni autenticidad.
