# Equipo — ADN y bandeja por estado

Solicitud autorizada: modernizar /equipo, mejorar uso del espacio y operabilidad. Mantener la dirección ADN aprobada: Archivo/Manrope, blanco dominante, navegación morada contenida, sin lemas, números ficticios ni párrafos obvios. Columna de título y columnas estado/origen/fecha, filas completamente enlazadas, vacíos breves y paginación clara; móvil apilado. Nombre por rol Reportes/Mis reportes; nuevo registro conserva destino y etiqueta existente. No tocar fichas/dashboard ni introducir búsquedas que filtren solo la página visible.

Mejora funcional acotada: enlaces de filtro por cinco estados y Todos, con conteos reales de registros consultables. Lista y conteos usan exactamente la regla existente author_id=usuario OR (reviewer y status distinto de draft). Las participantes solo propios; las revisoras no ven ni cuentan borradores ajenos. Estado validado contra enum, SQL parametrizado, paginación20+1 conserva estado, filtro reinicia página. Sin modificaciones de reportes, publicaciones, IA o permisos. Conteos/lista pueden cambiar entre consultas por actividad concurrente; no se presentan como métricas públicas.

CSS local y shell de /equipo por marcador local, sin rediseñar otras rutas. Navegación compartida solo añade aria-current correcto, conservando enlaces y autorización.

Validar filtros/conteos de ambos roles con fixtures, exclusión de borradores ajenos en lista y conteos, filtros inválidos, paginación con estado, vacíos, apertura de ficha, accesibilidad básica y tamaños320/390/768/1440. Iterar en dev; único build final y app únicamente.
