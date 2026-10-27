# Tutorial visual de Reportar — verificación

26-10-2026. Incremento solicitado: Driver.js sobre el formulario público, con ADN v2.

## Implementación

- `driver.js` 1.10.2 fijado en package/lock, instalado localmente; JS cargado con import dinámico al iniciar. Sin CDN ni envío de contenido al proveedor del tutorial.
- `ReportTour` independiente con «Ver cómo reportar», cinco focos reales (captura, enlace, descripción, consentimiento, envío), navegación en español y progreso. Estilo blanco/morado #69088B, Archivo/Manrope, foco visible y controles >=44 px.
- Tutorial voluntario y repetible; cierre/Escape, movimiento reducido y restauración de foco. Formulario temporalmente inert para impedir cambios o envíos durante explicación; no modifica campos, consentimiento ni archivos. No inicia mientras se envía ni aparece en confirmación.
- Limpieza de overlay/instancia al navegar/desmontar. Textos estáticos; no se interpola contenido privado en popovers.
- Corregido cierre antes de completar la primera animación: Driver puede omitir onDestroyed sin paso activo. onDestroyStarted garantiza desbloqueo y el foco se restaura después del render de React. Caso cubierto con aperturas/cierres inmediatos repetidos.

## Comprobaciones

- `npm install driver.js@1.10.2 --save-exact`: salida 0, auditoría 0 vulnerabilidades en ese momento.
- Typecheck y build Docker: salida 0. Imagen final `7462cd3bf183`.
- Primer pase de tutorial: 2/3; detectó el cierre temprano descrito. Tras corregirlo, prueba final conjunta con runner aislado: `report-tour.spec.ts evidence.spec.ts phase-one.spec.ts report-language.spec.ts`, **11/11**, salida 0. Cuentas ficticias deshabilitadas al terminar.
- Conservación de captura/texto/URL/consentimiento, cierre/repetición, Tab/Escape/flechas, limpieza mediante navegación cliente y cero POST de reportes durante el tutorial. Los cinco popovers caben en 320/390/768/1440 px; movimiento reducido y capturas de escritorio/móvil revisadas.
- Regresión real: envío → revisión humana → versión pública separada; permisos de borradores, validación de imágenes y URL, arrastre y selección preservados.
- Docker principal actualizado sin rebuild adicional. /reportar y /api/health HTTP 200; app/db saludables, worker activo. Datos antes/después: 4 reportes, 1 publicación, 3 evidencias. Entorno aislado detenido conservando volumen.

## Límites

Pruebas de navegador en Chromium. Pendiente valoración humana en dispositivo físico y comprobación con lectores de pantalla/Safari; no se atribuye esa cobertura a la emulación móvil.

## Movimiento entre pasos — 26-10-2026

A petición del usuario se conserva la composición aprobada. Spotlight de Driver420ms, scroll suave y entrada de tarjeta240ms (opacidad, desplazamiento8px y escala.985→1). Movimiento reducido desactiva las tres animaciones.

- Build Docker con TypeScript: salida0; imagen97fd90a09934.
- Inspección de transición mediante RAF: 27 posiciones intermedias del spotlight y animación report-tour-enter observadas en320/390/1440px. Tarjeta y control resaltado dentro del viewport al asentarse cada paso.
- Pase inicial de tutorial/retícula/hash6/7: un caso simulaba hashchange antes de hidratar el formulario. Se espera ahora a que el formulario esté listo antes de esa acción de la prueba. Pase final7/7, salida0; incluye cierre temprano, teclado, enlace directo y movimiento reducido.
- Docker local actualizado; app/db saludables, worker activo, health200. Datos conservados:4 reportes,1 publicación,3 evidencias. Entorno aislado detenido conservando volumen.
- No se repitió la suite de servidor ni el envío completo: cambio limitado a movimiento. Comprobación en Chromium; valoración humana del movimiento y dispositivos físicos pendiente.
