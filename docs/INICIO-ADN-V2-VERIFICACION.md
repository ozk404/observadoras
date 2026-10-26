# Inicio — ADN v2, verificación 26-10-2026

Dirección aprobada por el usuario con correcciones: blanco dominante y bloques donde `#69088B` sea protagonista, tomando como referencia el uso del color primario de Tecsify. Rechazo de obviedades, consensos morales y lemas motivacionales como copy de producto. Diseño revisado: `superpowers/specs/2026-10-26-home-adn-v2-design.md`. ADN y reglas adoptados en `9b68aa1`.

## Implementado

- Solo Inicio: título funcional «Reportes de violencia política digital.», descripción de su alcance, envío y consulta mediante enlaces reales. Se retiran el lema inicial rechazado, frases aspiracionales intercambiables y párrafos redundantes.
- Tipografía Archivo local con licencia incluida para los títulos de Inicio; Manrope continúa para lectura. Paleta, curvas y disposición asimétrica del ADN aprobado, espacio de ilustración sustituible sin imágenes rotas ni instrucciones técnicas visibles.
- Sección de revisión dividida blanco/morado institucional y bloque de catálogo de fondo morado, texto blanco y acción inversa. La publicación se condiciona a aprobación; original, imagen y URL conservan sus reglas de privacidad.
- CSS de página mediante módulo; ajustes de encabezado/pie acotados a `body:has(.home-v2)`. Las métricas del encabezado vuelven a su estado anterior al navegar a otra ruta. Se retira del footer compartido el lema genérico «Documentar. Revisar. Visibilizar.» según la corrección textual del usuario.
- Sin cambios de backend, rutas, contratos, datos, consentimiento o lógica de IA. Las siguientes páginas quedan para incrementos posteriores.

## Comprobaciones

- `npm run typecheck`, `git diff --check` y `docker compose build app`: salida 0. Imagen completa `e6eb16ebf8df`; fuente local incluida, sin dependencia de una CDN en el sitio.
- Entorno aislado `observadoras-home-v2-test`, `compose.ai-test.yaml`, puerto 3100. Proveedor simulado; sin llamadas reales a OpenAI ni datos privados de la base principal.
- `node scripts/test-e2e.mjs home-v2.spec.ts report-language.spec.ts phase-one.spec.ts --grep 'Inicio ADN|report terminology|mobile layout'`, con `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-home-v2-test`, `TEST_AI=true`: salida 0; **4/4 recorridos**. Sus once cuentas ficticias se deshabilitaron al terminar.
- Se comprobaron H1 único, ausencia de lemas rechazados o instrucciones técnicas visibles, publicación condicional, navegación real a formulario/catálogo/privacidad/ingreso, consentimiento conservado, acceso privado sin sesión, teclado, foco inverso blanco sobre morado y movimiento reducido.
- Bloques morados con color computado `rgb(105, 8, 139)`; contraste blanco/morado superior a 4.5:1. Capturas de 390/768/1440 px sin desbordamiento horizontal y con acciones principales de al menos 44 px.
- La primera ejecución directa de Playwright aprobó los tres recorridos sin preparación de cuentas y se detuvo en el `beforeAll` de la prueba móvil histórica por faltar `TEST_PASSWORD`. Se repitió con el ejecutor autorizado que provisiona y deshabilita cuentas ficticias; la ejecución final pasó completa. No se modificó esa protección ni el producto para sortearla.
- Capturas de prueba `artifacts/home-v2-1440.png`, `home-v2-768.png`, `home-v2-390.png` inspeccionadas. Capturas finales de localhost en reposo: `home-v2-final-1440.png` y `home-v2-final-390.png`, ignoradas por Git. Página HTTP 200 y cero errores de página registrados durante la captura.
- No se repitieron las 32 pruebas de servidor ni toda la suite funcional anterior: no cambiaron lógica ni contratos. Esta validación está limitada a presentación, navegación y regresión visual adyacente.

## Entorno local y cierre

`docker compose up -d --no-build`: salida 0; aplicación/PostgreSQL saludables y worker activo. Salud HTTP 200 y resumen privado sin sesión HTTP 401. Conteos antes/después: 2 cuentas habilitadas, 4 reportes, 1 publicación y 3 imágenes. No hubo pruebas con reportes reales ni modificación de sus datos.

La ilustración principal y archivos oficiales del logotipo siguen pendientes de suministro. El espacio actual no bloquea Inicio; el brief detallado está en `diseno/ADN-V2-PROPUESTA.md`. No se generaron imágenes ni se reconstruyeron marcas desde capturas. El entorno aislado se detuvo conservando su volumen. Cerrar revisión de Inicio con el usuario antes de rediseñar la página siguiente.
