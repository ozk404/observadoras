# Reportar — retícula y enlace directo al tutorial

26-10-2026. Corrección solicitada de composición/simetría y apertura mediante fragmento.

## Cambios

- Página hasta 1240 px: cabecera con título y acceso secundario al tutorial alineados, divisor compartido. Sin fila flotante del tutorial.
- Dos columnas iguales en escritorio: captura y enlace/descripción. Pie común de consentimiento/envío. En <=800 px se apilan respetando orden DOM y teclado. Mensajes, campos y API conservados; confirmación mantiene encabezado y no muestra tutorial.
- `/reportar#tutorial` inicia el recorrido al montar y mediante hashchange. Apertura manual refleja el fragmento con replaceState; cierre/fin lo retira conservando ruta/consulta y restaura un fragmento previo ajeno cuando corresponde.
- Cambiar a un fragmento ajeno cierra el recorrido sin sobrescribirlo. Cargar el módulo es cancelable por cambio de URL; limpieza al navegar no cambia otra ruta. No se crean entradas de historial por los controles del tutorial.
- Se evitó replaceState redundante cuando la URL ya contiene #tutorial, tras observar un fallo intermitente al cambiar fragmentos. Repetición específica final 5/5 aprobada.

## Verificación

- TypeScript y build Docker: salida 0. Imagen final `65beb919d9c7`.
- Primer pase de layout/hash/tutorial: 6/7; fallo intermitente descrito arriba, corregido antes de repetir.
- Pase final conjunto mediante runner aislado: `report-layout-hash.spec.ts report-tour.spec.ts evidence.spec.ts phase-one.spec.ts report-language.spec.ts`: **15/15**, salida 0. Incluye envío real con fixtures → revisión → versión publicada separada, permisos y validación de captura/URL.
- Medición de columnas iguales, alineación vertical y control del tutorial dentro de la cabecera; ancho utilizado >1100 px en viewport1440. Apilado/sin overflow320/390/768, popovers en todos esos anchos y1440. Capturas de escritorio/móvil revisadas.
- Enlace directo con query, cierre y recarga sin reapertura; hashchange, restauración de fragmento ajeno, cancelación con módulo pendiente. Teclado, cierre temprano, conservación de datos y cero envío durante tutorial.
- Docker local actualizado. /reportar y /api/health HTTP200; app/db saludables, worker activo. Antes/después: 4 reportes, 1 publicación, 3 capturas privadas. Cuentas ficticias deshabilitadas y entorno aislado detenido conservando volumen.
- No se repitió la suite completa de servidor: API y permisos no cambiaron. Navegador probado Chromium; pendiente valoración humana en dispositivo físico y Safari/lector de pantalla.
