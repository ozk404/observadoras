# Resultado del escaneo de entrega — 29-10-2026

Escáner Grype 0.121.0 con base de vulnerabilidades válida del 29-10-2026. Se ejecutó dentro de contenedores aislados sobre su sistema de archivos completo, excluyendo únicamente el propio escáner, su caché, los resultados y los sistemas virtuales /proc, /sys y /dev. No se filtraron vulnerabilidades por disponibilidad de parche ni se agregaron excepciones.

| Imagen | Críticos | Altos | Medios |
|---|---:|---:|---:|
| Aplicación anterior | 2 | 70 | 72 |
| PostgreSQL anterior | 6 | 100 | 131 |
| Aplicación de entrega | 0 | 0 | 3 |
| PostgreSQL de entrega | 0 | 0 | 4 |

Las cifras cuentan coincidencias paquete/aviso; un mismo CVE puede afectar varios paquetes. Cero críticos/altos no significa ausencia de vulnerabilidades. Los avisos medios permanecen visibles en los informes JSON locales.

## Entrega validada

- Node 22.23.4 y PostgreSQL 17.11; bases oficiales Alpine 3.24.3 fijadas por digest. No se cambia el stack de aplicación.
- Verificación de SWC GNU/musl y sharp durante la construcción; compilación de Next.js correcta.
- Aplicación, migración y worker configurados sin nuevas capacidades ni adquisición de privilegios.
- Arranque saludable de la imagen empaquetada y migraciones completas sobre PostgreSQL de entrega con datos vacíos de prueba.
- 36/36 pruebas de servidor aprobadas sobre las nuevas bases, sin omisiones, en una base temporal aislada.
- Siete recorridos de navegador comprobados: seis aprobados en la ejecución inicial y el restante aprobado después de quitar un encabezado repetido en la ficha. No se presenta como una sola ejecución de 7/7 sobre el mismo digest. La corrección no cambia código de servidor ni dependencias.
- La imagen final recompilada y reescaneada arranca correctamente; app/base saludables y worker en ejecución. Migraciones, permisos, separación de original/publicación, imágenes, corrección, retirada y concurrencia comprobados. No se repitió toda la suite histórica.
- Los análisis utilizan simulador; no se consumieron llamadas reales a OpenAI.

## Protección del entorno existente

localhost:3000 conserva su contenedor y sus datos. El override local mantiene PostgreSQL Bookworm y el volumen postgres_data. La entrega empaquetada usa un volumen distinto, production_data: no reutiliza físicamente los archivos de la base local entre distintas bibliotecas C. No se migraron datos reales ni se desplegó la candidata. Para transferir registros existentes hace falta una migración lógica planificada; no basta con cambiar de imagen sobre el volumen antiguo.

Imagen final: `observadoras-production-check:release-final-20261029`.

SHA256: `32b2f99cfb48fa25cc2d9020819f0e302e8d3c1c1490e385bfbbcf31a3183aa4`.

La ejecución inicial y las 36 pruebas de servidor usaron la primera imagen Alpine 52e3478; la final 32b2f99 corrige únicamente el encabezado duplicado y se comprobó con el recorrido afectado, arranque y un escaneo nuevo. Los paquetes y las bases no cambian entre ambas.

## Incidente durante la revisión

La exportación completa del antiguo generador SBOM agotó el espacio temporal de Windows. Se eliminó únicamente el tar temporal que había creado. Después Docker dejó de responder durante otra descarga; se reinició el motor y localhost:3000 volvió a responder HTTP200. Se limpió caché antigua de compilación bajo la autorización previa, sin eliminar volúmenes del proyecto. Las imágenes alternativas y el escáner no se instalaron sobre la aplicación local.

Los respaldos permanecen fuera del incremento. La credencial de prueba se conserva por decisión del usuario y su cambio queda a cargo de administración. La entrega técnica está preparada para instalación; no se realizó despliegue público ni se atribuye revisión jurídica institucional al aviso.


## Hallazgos medios conservados

- Aplicación: tres coincidencias de CVE-2025-60876 en paquetes BusyBox; el informe no ofrece una versión corregida.
- PostgreSQL: las mismas tres coincidencias y GHSA-mjcv-p78q-w5fw en github.com/moby/sys/user v0.1.0, incorporado por un binario de la imagen oficial. Ese aviso sí indica una corrección en 0.4.1. No se ocultó ni se corrigió sustituyendo binarios de la imagen oficial; queda documentado para actualizar la base cuando el proveedor lo incorpore.

El criterio técnico del escaneo fue fallo ante severidad alta o crítica. No se afirma que la entrega tenga cero vulnerabilidades. Los JSON completos y registros locales están en artifacts/release-scan-results/app-release-final.json, postgres-alpine.json, artifacts/release-unit-final.log y artifacts/release-e2e-final.log / release-e2e-recheck.log.

Guía de instalación y tratamiento de datos existentes: DESPLIEGUE.md. El entorno aislado de validación se detiene al finalizar sin borrar volúmenes. localhost:3000 conserva el modo de desarrollo solicitado; las páginas de producción se sirven compiladas.
