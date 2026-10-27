# Estado actual — 26-10-2026

Este resumen prevalece para conocer el estado técnico vigente. Los diseños y verificaciones anteriores conservan el alcance de su fecha, incluidos pendientes que luego se resolvieron.

## Implementado y verificado localmente

- Next.js + TypeScript + PostgreSQL y Docker Compose; aplicación y worker con la misma imagen.
- Reporte público sin cuenta, captura obligatoria, URL opcional y descripción; originales privados y catálogo independiente de versiones aprobadas por humanos.
- Acceso cerrado con roles participante/revisora; borradores internos, devolución y reenvío de ajustes, validación y publicación separadas.
- Análisis inicial automático de descripción y captura con OpenAI; cola persistente, recuperación y fallos acotados. Clasificación humana independiente, sin certificación de veracidad ni riesgo automático.
- Seguimiento privado: notas y cierre manual que conserva la publicación. Borradores de alerta manuales o asistidos por IA, con procedencia y guardado explícito, sin difusión automática.
- Contenido real autorizado por el usuario con consentimiento versionado del envío. Las pruebas siguen usando fixtures ficticios y proveedor simulado. No se reautorizan registros anteriores.
- Rutas públicas `/reportar` y `/reportes`; enlaces anteriores redirigen conservando identificadores y paginación.
- Primer dashboard privado para revisoras en `/equipo/dashboard`: total de reportes validados/publicados, barras y tabla de clasificación humana o estado, período por fecha de validación. No incluye relatos, identificadores ni sugerencias de IA.

Última validación: 32/32 pruebas de servidor con PostgreSQL y 31/31 recorridos completos de navegador. TypeScript, construcción y actualización local correctos; aplicación/PostgreSQL saludables, worker activo. Ver `FASE4-DASHBOARD-VERIFICACION.md` y, para el incremento anterior, `REPORTES-REALES-VERIFICACION.md`.

## Rediseño página por página

ADN v2 aprobado con blanco dominante, bloques protagonistas de morado `#69088B` y copy verificable sin obviedades o lemas morales. Inicio desarrollado como landing informativa: ámbitos, finalidad del monitoreo/incidencia, herramientas, Paridad 2026 y alcance territorial, sin flujo de trámite; ilustración pendiente de producción por el usuario con espacio sustituible. Reportar también incorpora ADN v2, captura protagonista con arrastre/vista previa y tutorial visual voluntario con Driver.js desde «Ver cómo reportar». Ver `REPORTAR-ADN-V2-VERIFICACION.md` y `REPORTAR-TUTORIAL-VERIFICACION.md`: 11/11 recorridos seleccionados aprobados tras la integración del tutorial. Las demás páginas conservan su diseño hasta su incremento. Ver `ADN_VISUAL.md`, `diseno/ADN-V2-PROPUESTA.md` e `LANDING-PROYECTO-VERIFICACION.md` (sustituye los hitos mínimos de copy y diseño anteriores). Verificación visual: cuatro recorridos seleccionados, TypeScript y build aprobados; no se repitieron pruebas de base porque no cambió lógica ni contratos.

Reportar: retícula de columnas iguales en escritorio, captura y descripción alineadas, tutorial integrado en cabecera y apertura directa mediante `/reportar#tutorial`. Último pase de este incremento: 15/15 recorridos seleccionados, build y actualización local aprobados; ver `REPORTAR-RETICULA-VERIFICACION.md`. Sustituye la composición en una columna de los hitos anteriores.

Ingreso modernizado con ADN v2: composición blanco/morado en dos columnas, Archivo local, copy breve, campos de 56px, mostrar/ocultar contraseña y error enfocado. CSS limitado a la ruta; autenticación/cookie/redirección y cuentas cerradas conservadas. Validación focalizada en desarrollo: 2/2 de interfaz y 1/1 autenticado (cuenta habilitada/deshabilitada y sesión existente), sin overflow en320/390/768/1440. Selectores de contraseña de pruebas existentes hechos exactos para distinguir el nuevo botón accesible. TypeScript y único build final aprobados (075d6edf0fda); actualizada solo app y worker intacto. Apertura empaquetada /ingreso y health200. No se repitieron suites de servidor ni flujos ajenos; pendiente revisión humana y Safari/dispositivos físicos.

Equipo modernizado como bandeja ADN: Archivo, navegación contenida morada, filas alineadas por título/estado/origen/fecha, filtros por estado con conteos reales y cabecera móvil compacta. Lista y conteos conservan author_id=cuenta o reviewer con estado distinto de draft; borradores ajenos excluidos también de los contadores. Paginación conserva estado, cambiar filtro reinicia página y estados inválidos se normalizan a Todos. Sin cambios de reportes, publicaciones, IA ni SQL de escritura. Nav compartida añade aria-current, sin rediseñar fichas o resumen.

Validación de este incremento: 6/6 (phase-one + team-queue) con fixtures y PostgreSQL de desarrollo; incluye ambos roles, conteos, 20+1 registros, filtros inválidos, vacíos, apertura de ficha y flujo de revisión/publicación separado. La prueba de bandeja usa valores basales para poder compartir cuentas con otras suites. Capturas y ausencia de overflow en 320/390/768/1440. TypeScript y único build final aprobados (deeb8cc48245); actualizada solo app, worker intacto, health200 y apertura autenticada/filtro del empaquetado correctos sin registrar contenido privado. No se repitió toda la suite de servidor; pendiente revisión humana y Safari/dispositivos físicos.

Incremento de capturas en Equipo: se conservan filas con miniaturas privadas de marco uniforme y proporción completa, sin recortes. El visor permite ampliar sin salir de la bandeja, ajustar a pantalla o recorrer la captura a tamaño real. Original descargado solo al abrir; miniatura WebP de hasta 256×192, sin caché pública ni optimizador de Next. Autorización comprobada antes de generar cada variante; sin cambios de esquema ni publicaciones.

Validación focalizada: bandeja y recorrido de evidencia aprobados con datos ficticios (horizontal, vertical, cuadrada y larga), permisos 401/404, proporciones/tamaño, apertura/cierre/foco/Escape, carga fallida y ausencia de overflow en 320/390/768/1440. TypeScript y único build final aprobados (bc5ff793a5f5); actualizada solo app, worker intacto. Smoke empaquetado: health200, redirección de equipo sin sesión y miniatura401 privada. No se repitieron suites ajenas; Safari y dispositivos físicos pendientes.

Simplificación autorizada: retirada la pantalla de creación interna y su botón «Nuevo registro». `/equipo/nuevo` redirige a `/reportar`, único formulario de recepción visible. No se añade otra modalidad de envío ni borradores al formulario público. Los registros/borradores previos y sus permisos se conservan; la API interna permanece por compatibilidad. La ruta antigua exige sesión por el layout privado y después redirige al formulario público. Validación: 6/6 recorridos phase-one/team-queue, TypeScript y build aprobados; solo app actualizada (b4e43fc4f583), worker intacto. Smoke empaquetado: health/reportar200 y protección de acceso sin sesión.

Cuenta del área privada integrada en la cabecera principal: nombre enlazado a Equipo y cierre de sesión sustituyen «Acceso del equipo»; retirada la franja privada duplicada. Integración cliente desde el layout autenticado, sin añadir consultas de sesión a las páginas públicas. Bandeja/permisos y ubicación de controles aprobados con fixtures; revisión visual y sin overflow en 320/390/768/1440, TypeScript y único build final aprobados (cacf33e265f2). Solo app actualizada; worker intacto. Smoke empaquetado: inicio/health200 y acceso privado protegido.

Tutorial voluntario de Equipo con Driver.js y ADN existente: filtros, listado, captura y apertura de ficha cuando existen, y resumen solo para revisoras. Acceso «Ver tutorial» y `/equipo#tutorial`, conservando query de filtros/paginación al cerrar. Sin datos ficticios visibles ni mutaciones; interacción de fondo bloqueada durante el recorrido, foco restaurado y movimiento reducido respetado. Prueba focalizada aprobada: recorrido, hash, Escape, teclado, pantalla vacía, salida de ruta y móvil de 320 px. TypeScript y único build final aprobados (7c7926e33b78); solo app actualizada, worker intacto. Smoke empaquetado health200 y acceso privado protegido. No se repitieron suites de datos ajenas; Safari/dispositivos físicos pendientes.

## Pendiente

- Ampliaciones del dashboard a dimensiones institucionales adicionales requieren campos/criterios aprobados. No hay desglose demográfico ni vista pública.
- Evaluación institucional de calidad de IA, taxonomía oficial y criterios de riesgo. No inventar esos criterios.
- Búsqueda/filtros operativos del listado, si se autorizan; administración de cuentas disponible actualmente por comandos.
- Operación institucional: conservación, canal de derechos, retirada de publicaciones, alojamiento, HTTPS, respaldo y restauración comprobada. La autorización técnica del usuario no equivale a aprobación institucional.
- Transferencia final y prueba de aceptación con el equipo. No se declara completo el producto por tener pruebas locales.

## Trazabilidad

Migraciones 001–010 aditivas y documentos de verificación por incremento. Consolidación guardada en `dacd3c3`; diseño del dashboard en `ab000e8`. Se conservan implementación, pruebas y documentación sin incluir `.env`, credenciales locales, capturas ni datos de base. El dashboard no requiere nuevas migraciones.
