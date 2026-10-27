# Reportar — verificación ADN v2

26-10-2026. Alcance: /reportar y su formulario público. CSS de ruta, sin cambios al API ni a permisos.

- Formulario de una pantalla: captura obligatoria, URL opcional, descripción y consentimiento existente. Selector accesible con texto español, vista previa y eliminación que limpia el archivo real y devuelve el foco al selector.
- Archivo local, blanco dominante y bloque morado #69088B; sin slogans, pasos adicionales ni avisos repetidos. Confirmación breve, sin promesas de publicación o seguimiento público.
- Typecheck y build Docker aprobados, salida 0.
- Primer pase: evidence, phase-one y report-language, 7/7. Incluye envío, revisión humana, publicación separada y permisos de borradores.
- Tras ajustes finales de selector/contraste: evidence y report-language, 3/3. Sin overflow a 320, 390, 768 y 1440 px. Inspección visual de capturas escritorio/móvil. El flujo completo de revisión se comprobó antes de esos ajustes de presentación, no se repitió después.
- Local actualizado con Docker Compose. /reportar y /api/health HTTP 200. Conservados 4 reportes, 1 publicación y 3 evidencias; pruebas aisladas sin datos reales y entorno de prueba detenido conservando su volumen.
- Pendiente: valoración humana de comodidad en dispositivo real. No se añadieron ilustraciones ni dependencias.

## Corrección: captura protagonista según referencia Tecsify

Esta revisión sustituye la composición de columna y aviso lateral anterior, que el usuario consideró demasiado genérica.

- Formulario centrado a 880 px, área amplia de captura, acción Seleccionar imagen y vista previa integrada con cambio/eliminación. Icono vectorial funcional, sin imágenes ni logos generados.
- Arrastre real de un archivo; rechazo de múltiples, tipos/tamaños inválidos; conserva archivo válido al rechazar o cancelar un reemplazo. El input multipart y la vista previa se sincronizan. Elegir no envía el archivo al servidor.
- Privacidad en bloque morado compacto bajo formulario. Consentimiento, rutas, API, campos y separación privado/publicación conservados.
- `npm run typecheck`: salida 0. `docker compose build app`: salida 0, imagen 91ba52f90e9d.
- E2E aislado: evidence, phase-one, report-language: 7 aprobados y 1 fallo por selector ambiguo del test (alerta del formulario y anunciador de Next). Corregido para apuntar a evidence-error; repetición del caso de arrastre/reemplazo/cancelación: 1/1 aprobado. Ningún cambio de aplicación tras estas pruebas.
- Revisión visual de estados vacío/seleccionado en escritorio y móvil; sin overflow en 320/390/768/1440. Teclado y envío completo hasta versión pública separada comprobados por phase-one.
- Docker local actualizado; app/db saludables, worker activo. /reportar y /api/health HTTP 200. Conteos antes/después: 4 reportes, 1 publicación, 3 capturas privadas. Entorno aislado detenido sin borrar volúmenes.
- Sigue pendiente la valoración humana en dispositivo real; la validación automatizada usa Chromium, no Safari ni Android/iOS reales.
