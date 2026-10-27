# Reportar — retícula equilibrada y enlace al tutorial

Corrección autorizada: aprovechar ancho, alinear/simetría e integrar el acceso al tutorial. Añadir enlace directo con fragmento.

Composición hasta 1240 px: cabecera alineada a izquierda y tutorial secundario a derecha dentro de la misma fila con divisor; sin fila flotante. Formulario en dos columnas iguales: captura izquierda, URL/descripción derecha. Consentimiento y envío comparten pie; bloque morado privado se conserva. Móvil apila en orden captura, URL, descripción, consentimiento, envío; sin saltos en teclado ni nuevos campos. Confirmación mantiene encabezado y no muestra tutorial.

PublicForm recibe encabezado renderizado por página para compartir cabecera con ReportTour, conservando estado busy y pertenencia al form. CSS limitado a reportar. Driver conserva sus cinco focos y ajustes de accesibilidad.

/reportar#tutorial abre al montar y al cambiar hash en la misma página. Inicio manual refleja #tutorial mediante replaceState, sin añadir entradas. Cierre/fin quita fragmento tutorial y preserva pathname/query; si había otro fragmento antes de apertura manual, lo restaura. Cambiar a otro fragmento durante el recorrido lo cierra sin sobrescribir el nuevo. Limpieza al salir no modifica otra ruta. Apertura asíncrona se cancela si cambió ruta/hash antes de cargar; nunca instancia duplicada, ni envía datos. Sin hashes por paso.

Validación: alineación/anchos iguales desktop, apilado móvil320/390/tableta, popovers y teclado, enlace directo/query y hashchange, cierre/recarga sin reapertura, fragmentos ajenos y navegación, conservación de campos, envío y privacidad. Docker local conservando datos.
