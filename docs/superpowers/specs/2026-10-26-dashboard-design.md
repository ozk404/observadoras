# Dashboard mínimo privado

El usuario aprobó avanzar después de la consolidación: dashboard privado con total de reportes validados, distribución por clasificación humana, tabla agregada y filtro por período. Mantener Next.js/PostgreSQL, ADN existente y economía de texto.

## Alcance y acceso

Página `/equipo/dashboard`, enlace «Resumen» solo para revisoras. API GET `/api/privado/dashboard`, sin caché. Exigir sesión habilitada de revisora tanto en página como en servicio/API; participantes no acceden a agregados globales. No añadir exportación ni vistas públicas.

Población: solo estados `validated` y `published`. El período usa fecha de validación humana `validated_at`, no fecha de envío. Opciones: últimos 30, 90, 365 días o todo el período. Valores desconocidos/duplicados producen error de filtros, sin mostrar datos. No filtrar por personas, territorio, plataforma ni otras dimensiones no aprobadas.

## Datos y consistencia

Agregación SQL con parámetros y una única instantánea: total, clasificación humana y estado actual. No leer ni retornar títulos, relatos, evidencias, URL, notas, nombres, identificadores de reportes o propuestas IA. Comprobar cuenta habilitada también en la consulta. No crear migraciones ni llamadas externas.

Clasificación usa exclusivamente `reviewed_categories`, una participación por reporte/categoría aunque haya duplicados. Sin categorías válidas se contabiliza `sin_clasificar`; varias categorías pueden sumar más que el total y se explica brevemente. Orden estable por cantidad y clave; etiquetas actuales siguen siendo orientativas. Estado muestra validado/publicado como segunda dimensión configurable del mismo gráfico y tabla, sin sumar pendientes ni borradores. No añadir grupos demográficos ni cruces de atributos; el acceso queda limitado a quienes ya pueden revisar todos los registros elegibles. No establecer una política institucional de umbrales de anonimato.

## Interfaz

Tres bloques: contador «Reportes validados», barras horizontales por clasificación/estado y tabla de la misma distribución con cantidades y porcentaje de reportes. Filtro de período con etiqueta «Fecha de validación» y selector «Agrupar por» (clasificación humana/estado); formulario GET, aplicar y restablecer reales. Mismo período para los tres bloques. Cero real con estado vacío sin valores inventados, sin porcentajes NaN. Tabla accesible, barras decorativas con datos textuales equivalentes; controles por teclado y móvil sin desbordamiento. Diseño editorial sobrio con morado institucional y tipografía existente, sin nuevas dependencias ni tarjetas decorativas.

## Validación y entrega

Fixtures ficticios incluyen validado, publicado, pendiente, borrador, ajustes, múltiples/duplicadas categorías, sin clasificación y fechas dentro/fuera del período. Comprobar exclusión de no validados y clasificación sugerida de IA; igualdad gráfico/tabla/total, períodos, cero, filtros inválidos y permisos sin sesión/participante/cuenta deshabilitada. Tests de servidor con PostgreSQL y E2E aislados, móvil/escritorio y capturas. No tocar reportes reales ni llamar a OpenAI. Construir y actualizar localhost solo tras pasar; verificar salud y conteos conservados. Actualizar estado/documentación y dejar implementación en commit separado de consolidación.
