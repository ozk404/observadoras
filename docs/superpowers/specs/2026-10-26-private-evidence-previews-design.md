# Bandeja — miniaturas privadas y ampliación

Solicitud: aprovechar capturas y evaluar tarjetas frente a filas, con imágenes de proporciones diversas. Mantener filas de bandeja: facilitan comparar estado/origen/fecha y preservan filtros/paginación aprobados. Añadir miniatura en la columna de título y ampliación accesible; no crear otra vista redundante de tarjetas.

Marco uniforme con object-fit contain: completa, sin recorte ni distorsión, fondo neutro. Retratos/capturas largas tendrán bandas libres; la ampliación muestra el original conservando proporciones. Sin imagen: icono neutro, sin requests404 ni botones falsos. Error: sustituto discreto. Carga lazy/asíncrona, miniaturas derivadas fijas256x192 máximo, sin agrandar originales. Ampliación nativa dialog con cierre/Escape/foco devuelto, scroll bloqueado durante apertura; original solo se solicita al abrir. Botón de captura separado del enlace de fila, sin interactivos anidados; enlace de título mantiene apertura de ficha y área clicable de fila.

Lista agrega solo EXISTS de evidencia, nunca binarios. Derivado usa el mismo endpoint de evidencia con vista=miniatura, autorización previa idéntica y private,no-store/Vary Cookie; sin optimizador público ni guardar copias en public, sin migración. Transformación limitada a20MP y concurrencia acotada por proceso. Original y catálogo público sin cambios.

Validar imágenes sintéticas horizontal/vertical/cuadrada/larga, ausencia y error, dimensiones/peso del derivado, permisos401/404 en ambos modos, modal/teclado/foco y no navegación al ampliar, original solo al abrir, móvil/escritorio, filtros/paginación existentes. Iterar en dev y único build final/app.
