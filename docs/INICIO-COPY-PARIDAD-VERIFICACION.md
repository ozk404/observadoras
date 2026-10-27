# Inicio — copy del observatorio, 26-10-2026

Solicitud: validar ADN, retirar flujos inútiles, obviedades, explicaciones redundantes y presentar el propósito de Observadoras en Paridad 2026. Se conserva la dirección visual aprobada y el alcance página por página.

## Fuente y criterio

Fuente proporcionada: `One-pager_Paridad 2026_Fundación Oxlajuj N'oj.pdf`, una página. Se extrajo el texto con pypdf y se renderizó con PDFium para revisión visual completa, dado el espaciado y los problemas de codificación de la extracción. El original permanece fuera del repositorio; su captura de lectura se ignora en Git.

El one-pager describe monitoreo ciudadano, generación de evidencia y propuestas ante instituciones estatales, participación de mujeres jóvenes y juventudes diversas en Guatemala. Las metas y resultados esperados del programa no se presentan como logros del software. No se reutilizaron retratos, contactos ni logos del PDF como recursos del sitio.

La descripción aportada por el usuario orienta el propósito del observatorio. Se contrastó con el código: clasificación/resúmenes y borradores IA, revisión humana y seguimiento están disponibles; riesgo y patrones entre casos siguen pendientes y no se anuncian como funciones actuales. Tampoco se promete anonimización garantizada ni atención sociojurídica desde la plataforma.

## Cambios

- H1 «Observatorio ciudadano digital.» y descripción de documentación/análisis de violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala.
- Eliminado el flujo numerado 01–03 y el bloque de explicación del trámite/privacidad. Formulario y aviso conservan consentimiento y datos de tratamiento.
- Bloque dividido con contexto de Paridad 2026 y sus fines de generación de evidencia/propuestas; bloque morado con funciones concretas de IA y supervisión del equipo. Sin simular otro flujo mediante una lista de capacidades.
- Acceso al catálogo reducido a «Reportes publicados» y su acción, sin descripción redundante.
- ADN y AGENTS refuerzan que una frase verdadera no basta para conservarla: debe aportar información específica del observatorio o ayudar a decidir/actuar. Eliminar secciones completas si no aportan valor.
- Sin cambios de backend, rutas, permisos, formularios, IA, datos ni recursos de imagen pendientes.

## Verificación

- `npm run typecheck`, `git diff --check` y `docker compose build app`: salida 0. Imagen `feb56360beea`.
- Entorno aislado `observadoras-home-v2-test` con proveedor simulado, sin llamadas reales a OpenAI ni uso de reportes reales.
- `node scripts/test-e2e.mjs home-v2.spec.ts report-language.spec.ts phase-one.spec.ts --grep 'Inicio ADN|report terminology|mobile layout'`, con base `http://localhost:3100`, Compose `compose.ai-test.yaml`, proyecto `observadoras-home-v2-test` y `TEST_AI=true`: **4/4 aprobados**, salida 0. Las once cuentas ficticias se deshabilitaron al finalizar.
- Se comprueban contenido alineado, ausencia de pasos/listas y afirmaciones no implementadas, colores/contraste/foco, navegación real, privacidad y consentimiento accesibles, aislamiento del shell, teclado y movimiento reducido. Capturas 1440/768/390 px inspeccionadas, sin desbordamiento horizontal.
- No se repiten pruebas de base o integración IA: no se modificaron contratos ni lógica. La cobertura anunciada para este incremento es de presentación/navegación.
- Actualización local con `docker compose up -d --no-build`; salud HTTP 200, resumen privado sin sesión HTTP 401 y conteos conservados: 2 cuentas habilitadas, 4 reportes, 1 publicación y 3 imágenes. Aplicación y PostgreSQL saludables; worker activo.
- Entorno aislado detenido conservando su volumen. Inicio permanece sujeto a revisión de copy del usuario antes de avanzar a otra página.

Diseño acotado y revisado en `superpowers/specs/2026-10-26-home-project-copy-design.md`. Esta actualización sustituye el copy y el bloque de pasos del hito documentado en `INICIO-ADN-V2-VERIFICACION.md`.
