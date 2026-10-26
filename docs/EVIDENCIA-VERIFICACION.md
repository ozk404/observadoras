# Evidencia de denuncia pública — Verificación local

Corrección autorizada por el usuario: captura obligatoria, URL opcional y descripción en `/denuncia`, sin exigir título manual. Imagen y URL privadas, sin publicación ni envío automático a OpenAI. Los registros y formularios internos anteriores se conservan.

## Resultado

- `npm run typecheck`: código 0.
- `docker compose build app`: código 0, compilación de producción y tipos aprobados.
- `npm test` local: código 0, 19 pruebas aprobadas; la de migración se reserva a PostgreSQL.
- Suite en contenedor con `TEST_DATABASE_MIGRATIONS=true`: código 0, **20 aprobadas, ninguna omitida**.
- Suite de navegador sobre Compose aislado y proveedor IA simulado: código 0 en ejecución final, **14 escenarios aprobados, ninguno omitido**.
- Configuración de ambos Compose validada.
- Capturas del formulario con vista previa inspeccionadas en escritorio y móvil; sin desbordamiento a 390 px.

## Casos comprobados

Imagen obligatoria; URL no obligatoria; vista previa; decodificación y retiro de EXIF; tamaño y dimensiones; rechazo de SVG, tipo falsificado, contenido corrupto, archivo vacío, cuerpo excesivo, campos duplicados y URLs inseguras/con credenciales. Solo PNG/JPEG/WebP estáticos hasta 5 MiB/20 megapíxeles; normalización a WebP sin pérdida y límite de salida equivalente.

El envío real de navegador guarda descripción, imagen y URL. La imagen se recupera como WebP con caché deshabilitada, visible para la revisora y denegada a visitantes y a otra participante. La publicación posterior no expone la imagen ni la URL original. Reintentar la misma clave no crea otro registro. Se ejecutaron también los recorridos de borradores, ajustes, validación, publicación, IA simulada y permisos.

La prueba de migración verifica que los registros anteriores conservan publicación y atribución y reciben URL nula, sin inventar evidencias. La imagen se guarda en PostgreSQL en la misma transacción del registro y evento; el contenido binario no se consulta en listados ni catálogo. Se comprueba que recrear el contenedor de aplicación conserva las imágenes.

En el primer pase la prueba de recorrido intentó extraer la clave del cuerpo multipart de una petición de navegador; esa información no estaba disponible como texto con archivo. Se adaptó el test para usar una UUID de fixture conocida. No se cambió la generación de claves del producto. Se reiniciaron solo contadores técnicos de la base aislada antes de la ejecución final completa.

## Entorno y límites

Proyecto aislado `observadoras-evidence-test`, con imágenes sintéticas y OpenAI simulado; no se hicieron llamadas externas ni se usaron denuncias reales. Sus cuentas de prueba quedaron deshabilitadas. Se detiene conservando su volumen. La configuración `.env`, las credenciales de revisión `.env.review` y el borrador interno del entorno principal se conservan.

La evidencia es una versión normalizada, no el archivo original ni una cadena de custodia forense. Eliminar metadatos no oculta datos visibles. Retención, capacidad/respaldos y condiciones institucionales para datos reales permanecen pendientes. No se habilitan adjuntos genéricos, edición de imagen desde la plataforma ni publicación de capturas.

Archivos principales: migración 005, módulo de validación/lectura acotada de evidencia, schema/transacción de registro, formulario público, ruta protegida de imagen, detalle privado, aviso de privacidad, dependencia sharp, CSP para vista previa y pruebas/documentación.
