# Landing informativa del proyecto — 26-10-2026

El usuario aclara que Inicio debe ser una landing que informe el proyecto, no una portada mínima de acceso. Esta ampliación conserva el ADN y los límites del copy: sin obviedades, lemas morales, pasos triviales, promesas no implementadas ni cifras inventadas.

## Secciones

- Apertura: observatorio ciudadano digital, alcance temático y Guatemala; envío/consulta reales y espacio de ilustración pendiente.
- Ámbitos de observación: violencia política digital, desinformación y barreras a la participación, delimitados con ejemplos breves. No se presenta una taxonomía oficial ni se inventan filtros.
- Finalidad: organización de registros para documentar problemáticas y sustentar propuestas de la Fundación ante instituciones estatales. Se distingue propósito de incidencia de impacto ya logrado.
- Herramientas: registro y seguimiento del equipo, sugerencias IA bajo revisión humana y panel agregado privado. No es un flujo numerado ni un tutorial de envío.
- Paridad 2026: iniciativa de la Fundación para mujeres jóvenes y juventudes diversas; marco de monitoreo ciudadano, incidencia normativa y acciones sociojurídicas del programa. Se citan Guatemala, Baja Verapaz, Quetzaltenango, Jutiapa, San Marcos y Quiché como alcance del programa, sin cambiar la admisión de reportes.
- Catálogo público: enlace a versiones existentes publicadas por el equipo, sin casos o métricas inventados.

Fuente: descripción del proyecto aportada por el usuario y one-pager de Paridad 2026, leído y revisado visualmente en el incremento anterior. No se reutilizan contactos, retratos, logos ni números de resultados esperados como impacto logrado. El programa puede contemplar acciones sociojurídicas; el sitio no ofrece atención o activación automática de esas acciones. Riesgo, patrones entre casos y anonimización garantizada no se anuncian como funciones actuales.

## Diseño y alcance

Ámbitos en columnas/filas editoriales sin tarjetas repetidas, finalidad en bloque morado completo, herramientas en definiciones y programa/territorio en bloque dividido. Blanco dominante, `#69088B`, tipografía y espacio de imagen aprobado. Solo cambia Inicio y su CSS local; rutas, backend, formularios, IA, permisos y datos permanecen fuera del incremento.

ADN actualizado: economía de texto no significa vaciar la landing ni prohibir listas informativas. Cada sección debe responder una pregunta distinta sobre el proyecto. Diseño revisado en `superpowers/specs/2026-10-26-project-landing-sections-design.md`.

## Verificación

- TypeScript, `git diff --check` y `docker compose build app`: salida 0. Imagen completa `3b4b1ff4f503`.
- Entorno aislado `observadoras-home-v2-test` con proveedor simulado. `node scripts/test-e2e.mjs home-v2.spec.ts report-language.spec.ts phase-one.spec.ts --grep 'Inicio ADN|report terminology|mobile layout'`, base `http://localhost:3100`, archivo `compose.ai-test.yaml`, mismo proyecto y `TEST_AI=true`: **4/4 aprobadas**, salida 0. Sus once cuentas ficticias se deshabilitaron al finalizar.
- Contenido de las secciones, ejemplos de ámbitos, seis departamentos, funciones disponibles y privacidad del panel; ausencia de pasos numerados, lemas y claims de riesgo/patrones. Se conservan navegación real, consentimiento y aislamiento visual de páginas adyacentes.
- Contraste blanco/morado >=4.5:1, foco visible, objetivo primario >=44 px, movimiento reducido y vistas de 390/768/1440 px sin desbordamiento. Capturas completas inspeccionadas: `artifacts/home-v2-1440.png` y `home-v2-390.png`, ignoradas por Git.
- No se repiten pruebas de base ni IA, ya que no hay cambios de lógica o contratos. No hubo llamadas reales a OpenAI ni pruebas con reportes reales.
- `docker compose up -d --no-build`: salida 0; página/salud HTTP 200, resumen privado sin sesión HTTP 401, aplicación/PostgreSQL saludables y worker activo. Conteos conservados: 2 cuentas habilitadas, 4 reportes, 1 publicación y 3 imágenes.
- Entorno aislado detenido conservando su volumen. Ilustración y logotipo oficial siguen pendientes según el brief; no bloquean este incremento.

Esta landing sustituye la composición mínima del hito `INICIO-COPY-PARIDAD-VERIFICACION.md`; conservar ese documento como registro histórico.
