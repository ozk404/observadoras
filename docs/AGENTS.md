# AGENTS.md — Instrucciones para Codex

Trabajas en **Observadoras Digitales**, una plataforma piloto de monitoreo ciudadano para Fundación Oxlajuj No’j. El objetivo es implementar lo definido por el TDR y el Producto 1 aprobado, **sin ampliar el alcance** ni comprometer privacidad.

## Leer antes de implementar

1. `PROJECT.md`: propósito, funciones, límites y criterios globales.
2. `FLUJOS_Y_DATOS.md`: actores, permisos propuestos, estados, datos y pruebas de negocio.
3. `ADN_VISUAL.md`: identidad, componentes y accesibilidad.
4. `FASES_DE_IMPLEMENTACION.md`: orden de trabajo y aceptación.
5. `DECISIONES_PENDIENTES.md`: asuntos no aprobados y soluciones conservadoras.

## Primera acción obligatoria: inspeccionar el repositorio

- **No** asumas que empezamos desde cero: la plataforma ya está en desarrollo.
- Identifica stack, estructura, servicios, autenticación y funciones reales **a partir del código**, no a partir de los diagramas.
- No introduzcas frameworks, cambios de arquitectura, nueva infraestructura o servicios externos sin demostrar necesidad y obtener indicación.
- Antes del primer cambio, presenta diagnóstico de implementado/parcial/ausente y propón el incremento mínimo.

## Límites de producto

**Excepción acordada expresamente con el usuario (25-10-2026):** el repositorio partía sin código. Se autoriza Next.js + TypeScript + PostgreSQL y Docker Compose. La fase 1 añade formulario público sin cuenta y catálogo de versiones revisadas; solo el original sigue privado. Se autoriza revisión/publicación manual básica en fase 1, sin automatización. Los límites previos sobre portal público se sustituyen únicamente para estas versiones aprobadas. Ver `FASE1-DISENO.md`.

- **Sí:** registro estructurado, consulta autorizada, sugerencias IA, revisión humana, seguimiento, borradores de alertas, dashboard mínimo.
- **No:** scraping de redes, análisis predictivo avanzado, identificación automática de personas, denuncia/publicación automática, portal público de casos, app nativa, BI avanzado.
- La IA es auxiliar; no debe validar o decidir por sí sola.
- Solo roles autorizados pueden revisar y validar.
- El sistema debe seguir sirviendo para crear y revisar registros aunque la IA falle.

## Protección de datos — requisito de implementación

- Minimiza datos personales desde el diseño del formulario.
- Antes de enviar información a cualquier proveedor de IA, elimina o protege información identificable y verifica que el tratamiento esté autorizado; si hay duda, **no envíes**.
- No uses datos reales de víctimas, participantes o terceros en tests, demos, fixtures, prompts de depuración o logs.
- No muestres información individualizable en dashboard ni en mensajes de error.
- Valida autorización al leer/modificar datos; el ocultamiento visual de botones no es seguridad.
- No incluyas secretos, claves, identificadores privados ni credenciales en el código o los documentos.
- Evita afirmar “anonimizado” si solo se ocultaron algunos campos sin comprobar el riesgo de reidentificación.

## Cómo ejecutar cada tarea

### Economía de texto en la interfaz

- Usar copy concreto y verificable sobre el producto. No usar obviedades o consensos morales disfrazados de mensaje («La participación de las mujeres cuenta») ni lemas motivacionales intercambiables. Cada frase debe aportar propósito, alcance, requisito o funcionamiento real.
- Blanco dominante con bloques protagonistas de morado institucional `#69088B`, según ADN v2. Aplicar página por página; no rediseñar por accidente pantallas aún no revisadas mediante CSS global.

- **Avoid unnecessary supporting text, descriptive copy, and redundant UI microcopy.** Evita etiquetas y descripciones secundarias innecesarias. Deja que el diseño haga la explicación.
- Diseño y textos deben complementarse, sin repetir lo que ya comunican el título, la acción, el estado o la estructura visual.
- No añadas subtítulos, párrafos explicativos, avisos o etiquetas decorativas por defecto. Cada texto debe aportar información necesaria para realizar la tarea o tomar una decisión.
- Conserva las etiquetas accesibles, errores específicos y avisos de privacidad o confirmaciones necesarios; exprésalos de forma breve, contextual y sin duplicarlos.

1. Definir **una tarea acotada** y sus criterios de aceptación antes de tocar archivos.
2. Reutilizar funciones y componentes existentes cuando resulte viable.
3. Mantener consistencia visual con `ADN_VISUAL.md`, sin inventar logos o pantallas decorativas.
4. Agregar o actualizar pruebas de permisos, estados y privacidad según el cambio.
5. Ejecutar comprobaciones disponibles en el repositorio y comunicar las no ejecutadas.
6. Al terminar informar: archivos modificados, conducta implementada, pruebas y resultados, limitaciones y siguiente incremento sugerido.

## Qué hacer ante ambigüedad

- Distinguir claramente **fuente aprobada** de **propuesta de implementación**.
- Preferir mínimo privilegio y funcionalidad más simple cuando no aumente riesgo ni cree un compromiso nuevo.
- En cuestiones sensibles —escala de riesgo, tratamiento de datos reales, permisos amplios, adjuntos sensibles, publicaciones, servicios externos— no inventar una política: registrar el bloqueo en `DECISIONES_PENDIENTES.md` y solicitar definición concreta.
- No eliminar ni reemplazar trabajo existente para “simplificar” sin revisar impactos.

## Flujo eficiente aprobado (26-10-2026)

Aplicar `DESARROLLO_Y_VALIDACION.md`. Iterar en Docker de desarrollo aislado 3100 con recarga, sin build/up por edición. 3000 conserva la versión empaquetada. Pruebas visuales sin cuentas; interacción con recorridos focalizados; API/permisos/datos con integración del flujo afectado. Usar perfil core de cuatro cuentas para pruebas que solo requieren reviewer/participant/other/disabled (phase-one, ingreso y bandeja); los flujos con cuentas especializadas requieren perfil all. Nunca usar datos reales en desarrollo/pruebas.

Resolver la revisión visual antes de un único build final del incremento. Para frontend, recrear solo app sin dependencias; migraciones/worker únicamente si el alcance lo exige. No repetir suites ni conteos de la base por rutina cuando no cambia almacenamiento. No reconstruir producción por cambios exclusivamente documentales o de tests. Reservar especificaciones/revisiones extensas para decisiones nuevas: no reiniciar brainstorming ni generar un documento por cada microajuste dentro de diseño ya aprobado. Esto aplica la instrucción expresa del usuario de reducir esperas y documentación desproporcionada. Conservar revisión inicial de Git, comprobaciones necesarias y reporte honesto de límites.

## Definición de terminado para un incremento

El flujo acordado funciona; se comprobaron permisos y protección de datos involucrados; no se introdujeron funcionalidades ajenas; es usable en móvil/escritorio cuando aplica; están documentados los límites; existe una forma clara de verificarlo.


## Entorno único autorizado (27-10-2026)

Sustituye la distribución anterior3100/3000: trabajar y revisar en localhost:3000 con recarga automática sobre los datos existentes. `node scripts/dev.mjs up` usa compose.yaml + compose.override.yaml; no reconstruir por ajustes visuales. El entorno3100 se reserva a pruebas aisladas bajo demanda (`test-up`, `ui`/`auth`, `test-down`), con fixtures y simulador; dejarlo detenido al terminar. Entrega empaquetada únicamente al cerrar un bloque acordado, usando `-f compose.yaml` para omitir el override. No ejecutar pruebas con fixtures sobre la base principal.
