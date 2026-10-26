# Captura obligatoria y URL opcional en denuncia pública

Corrección solicitada y confirmada por el usuario durante la revisión manual. `/denuncia` debe pedir una captura obligatoria, URL opcional y descripción; deja de exigir título manual. Se genera una referencia interna sin extraer datos del relato. Formularios internos y registros anteriores se conservan en este incremento.

Evidencia original privada, visible solo a quienes ya pueden consultar el registro. Nunca se publica ni adjunta automáticamente a OpenAI. La aprobación de una versión textual no cambia esa regla. No se consultan ni descargan URLs desde el servidor. Enlaces solo http/https, sin credenciales, y apertura explícita sin referrer.

Una imagen estática PNG/JPEG/WebP, máximo 5 MiB y 20 megapíxeles. Se comprueba contenido real, se decodifica y normaliza a WebP sin pérdida ni metadatos; no se conserva nombre de archivo. Esto no oculta nombres visibles ni certifica autenticidad. Petición multipart limitada a 6 MiB y hasta dos decodificaciones concurrentes por proceso; conservar límites de frecuencia y origen.

Almacenamiento: tabla privada separada con imagen binaria, dimensiones y hash, en PostgreSQL persistente existente. Un único adjunto acotado por registro permite guardar denuncia/evidencia/evento de forma transaccional y mantener respaldos coherentes, sin rutas públicas, ficheros huérfanos o infraestructura nueva. Listados y catálogo no seleccionan el contenido binario. La capa de acceso permite sustituir el almacenamiento posteriormente si el volumen requiere objetos externos; revisar capacidad/respaldos antes de uso institucional.

Verificar obligatoriedad, formatos falsificados/SVG/archivo corrupto/tamaño/dimensiones, metadatos eliminados, URL insegura, persistencia, reintento sin duplicación, consulta autorizada y bloqueo a visitantes/participantes ajenos; ausencia de evidencia/URL en catálogo y continuidad de registros existentes. Pruebas solo con capturas sintéticas. No se habilitan archivos genéricos ni tratamiento institucional de información real sin las condiciones pendientes.
