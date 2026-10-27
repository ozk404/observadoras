# Tutorial visual de Reportar con Driver.js

Solicitud explícita: integrar Driver.js para explicar visualmente cómo subir un reporte, con ADN del proyecto. Alcance /reportar, sin cambios al formulario/API.

Recorrido voluntario y repetible desde Ver cómo reportar, visible antes de la captura. Cinco focos: captura (seleccionar/arrastrar y ocultar datos), URL opcional, descripción/contexto, autorización OpenAI, envío privado a revisión. Una frase por paso. Spotlight sobre controles reales, popover con tipografía Archivo/Manrope, morado #69088B, progreso, anterior/siguiente/terminar y cierre accesible en español. Sin imágenes nuevas ni wizard obligatorio.

Dependencia local driver.js, carga JS al iniciar mediante import dinámico. No CDN, telemetría, almacenamiento de respuestas o detección de primera visita. Solo texto estático en popovers, nunca interpolar datos privados. El tutorial no modifica archivos/campos/consentimiento ni envía el formulario. Bloquea interacción con el control resaltado mientras explica; al cerrar vuelve el foco al iniciador. Respeta movimiento reducido. Limpia instancia/overlay/listeners al desmontar y tras envío; no aparece en confirmación ni inicia durante envío.

Validar avance/retroceso/fin, Escape/cierre, teclado, repetición, salir conserva valores/imagen/consentimiento, no POST de reportes por tutorial, ausencia de overlay al navegar, móvil320/390/tableta/escritorio y reduced motion. Build y regresión envío/revisión/publicación con datos ficticios en entorno aislado. Actualizar Docker conservando datos.
