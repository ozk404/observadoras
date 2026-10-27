# Reportar — verificación ADN v2

26-10-2026. Alcance: /reportar y su formulario público. CSS de ruta, sin cambios al API ni a permisos.

- Formulario de una pantalla: captura obligatoria, URL opcional, descripción y consentimiento existente. Selector accesible con texto español, vista previa y eliminación que limpia el archivo real y devuelve el foco al selector.
- Archivo local, blanco dominante y bloque morado #69088B; sin slogans, pasos adicionales ni avisos repetidos. Confirmación breve, sin promesas de publicación o seguimiento público.
- Typecheck y build Docker aprobados, salida 0.
- Primer pase: evidence, phase-one y report-language, 7/7. Incluye envío, revisión humana, publicación separada y permisos de borradores.
- Tras ajustes finales de selector/contraste: evidence y report-language, 3/3. Sin overflow a 320, 390, 768 y 1440 px. Inspección visual de capturas escritorio/móvil. El flujo completo de revisión se comprobó antes de esos ajustes de presentación, no se repitió después.
- Local actualizado con Docker Compose. /reportar y /api/health HTTP 200. Conservados 4 reportes, 1 publicación y 3 evidencias; pruebas aisladas sin datos reales y entorno de prueba detenido conservando su volumen.
- Pendiente: valoración humana de comodidad en dispositivo real. No se añadieron ilustraciones ni dependencias.
