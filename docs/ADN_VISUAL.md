# ADN_VISUAL.md — Identidad y experiencia de interfaz

## 1. Propósito

Adaptar la identidad de **Fundación Oxlajuj No’j** a una aplicación web de monitoreo: institucional, clara, accesible y funcional. **No** copiar literalmente el sitio público ni convertir los formularios en piezas de campaña.

**Origen de las referencias:** capturas del sitio y materiales institucionales entregados por el proyecto. El color `#69088B` fue proporcionado explícitamente como principal. Los demás tonos son **propuestas de diseño**, no códigos oficiales verificados.

## 2. Paleta base

| Token semántico | Valor | Uso |
|---|---|---|
| `brand.primary` | `#69088B` | Botón principal, foco visual moderado, navegación activa, elementos de marca. |
| `brand.secondary` | `#55288F` | Acentos institucionales secundarios; uso limitado. |
| `brand.deep` | `#300060` | Encabezados oscuros de alto contraste cuando sea necesario. |
| `surface.default` | `#FFFFFF` | Fondo principal, formularios, paneles de trabajo. |
| `surface.subtle` | `#F3EEF4` | Áreas secundarias, estados informativos discretos. |
| `text.primary` | `#281635` | Texto principal. |
| `border.subtle` | `#E7DEEC` | Separadores, contornos de tarjetas y campos. |

- El blanco debe **dominar las superficies de trabajo**; no llenar de morado todas las pantallas.
- Estados como error, advertencia y éxito necesitan colores funcionales accesibles **además de texto e iconos**; no usar colores de campañas como código semántico automático.
- Morado institucional con texto blanco para CTA principal. Mantener contraste suficiente también en hover, deshabilitado y foco.

## 3. Tipografía

- Estilo: **sans serif moderna y muy legible**, con títulos robustos y texto neutro.
- Definir una familia coherente según recursos autorizados y disponibilidad real; no asumir que conocemos la tipografía institucional exacta.
- Jerarquía propuesta: título de página, sección, subtítulo, etiqueta de campo, ayuda y metadatos.
- Texto de interfaz en pesos normales; no usar todo en negrita, mayúsculas ni fuentes decorativas de campañas.
- No usar tamaños extremadamente pequeños en tablas o formularios.

## 4. Sistema de componentes

- **Botón principal:** fondo `brand.primary`, etiqueta clara, estados hover/focus/disabled.
- **Botón secundario:** fondo blanco o sutil, borde discreto y jerarquía inferior.
- **Campos:** etiqueta visible, ejemplo/ayuda cuando se necesite, validación específica junto al campo.
- **Tarjetas:** fondo blanco, borde suave, sombra mínima u omitida.
- **Tablas/listados:** filas legibles, textos alineados, estados explícitos y navegación móvil adecuada.
- **Etiquetas de estado:** nombre textual siempre visible; nunca depender únicamente de un color.
- **Iconografía:** una sola familia de íconos lineales, sin mezclas arbitrarias.
- **Bordes:** redondeo moderado (aproximadamente 10–16 px), sin exceso de píldoras ni figuras decorativas.
- **Espaciado:** generoso y consistente; priorizar una estructura que permita completar tareas sin distracciones.

## 5. Plantilla de navegación recomendada

- Encabezado con **logotipo institucional real** y nombre del producto.
- Navegación de primer nivel únicamente para áreas necesarias: hallazgos, dashboard (si el rol tiene acceso) y administración (si corresponde).
- En páginas operativas: título específico, acción primaria visible y contenido principal. Añadir contexto solo cuando aporte información necesaria que el diseño no comunique.
- Acciones destructivas o que cambian estados: confirmar e informar el resultado.
- No introducir paneles KPI o menús simplemente para llenar espacio.

## 6. Pantallas y patrones concretos

### Listado de hallazgos
- Título, acción **Nuevo hallazgo**, filtro mínimo y lista de registros accesibles al rol.
- Mostrar tipo, fecha relevante y estado sin exponer información confidencial en previsualizaciones innecesarias.

### Formulario
- Ordenar campos por lógica del registro; marcar los obligatorios.
- Guardar borrador cuando aplique; mensajes de error precisos.
- Incluir advertencia contextual antes de introducir datos sensibles, sin alarmismo decorativo.

### Sugerencias de IA y revisión
- Separar visualmente **dato registrado**, **sugerencia de IA** y **decisión de la persona revisora**.
- Identificar sugerencias como no verificadas; ofrecer corregir y validar explícitamente.
- Nunca presentar una probabilidad o etiqueta de IA como dictamen oficial.

### Dashboard
- **Exactamente tres tipos de bloque principales**: contador, barras configurables y tabla agregada.
- Filtros básicos. No mapas, mosaicos de tarjetas interminables ni gráficos adicionales por defecto.

## 7. Accesibilidad y responsividad

- Navegable por teclado con foco visible.
- Etiquetas y mensajes asociables a sus controles.
- Contrastabilidad verificable para texto, botones, enlaces y estados.
- Diseño adaptable desde pantallas móviles; tablas pueden desplazarse horizontalmente cuando sea necesario, con encabezados claros.
- Evitar interacción dependiente exclusivamente del color, hover, gestos o iconos sin texto.
- No utilizar fotos sensibles ni datos reales como contenido de prueba.

## 8. Qué NO copiar de los materiales de campaña

- Collages, texturas granuladas intensas, tipografías de recortes, flores decorativas o ilustraciones grandes dentro de formularios, listados y revisión de casos.
- Colores ocasionales de proyectos como verde lima, naranja, turquesa o amarillo como nueva paleta principal.
- Logos de socios, donantes o campañas sin autorización y activos auténticos.
- Retratos de personas reales como avatar o elemento de demostración.

Las ilustraciones institucionales pueden aparecer en bienvenida o estados vacíos **solo si están autorizadas** y no comprometen la claridad del producto.

## 9. Integridad de marca

- No dibujar, regenerar ni inventar versiones del logotipo; usar el recurso oficial suministrado.
- No inventar logotipos de aliados o de Tecsify.
- El logotipo y marca principal del producto pertenecen visualmente a Fundación Oxlajuj No’j. Cualquier crédito al desarrollador debe ser discreto y acorde a lo convenido.
- Si faltan logotipos o fuentes, usar un espacio reservado neutro y registrar el pendiente, nunca improvisar una imagen institucional.

## 10. Criterio de aceptación visual

Una pantalla pasa la revisión visual si: comunica una tarea clara, respeta la paleta, utiliza componentes coherentes, se entiende en móvil y escritorio, permite uso accesible, evita redundancias entre diseño y textos y no introduce datos, funciones ni identidades inventadas.

## 11. Economía de texto y claridad visual

**Avoid unnecessary supporting text, descriptive copy, and redundant UI microcopy.** Evita etiquetas y descripciones secundarias innecesarias. Deja que el diseño haga la explicación.

- La jerarquía, el espaciado, la agrupación y los controles deben hacer comprensible la interfaz. Diseño y textos se complementan; no repiten la misma explicación.
- No acompañar cada título, tarjeta, campo o botón con una descripción por defecto. Añadir texto solo si resuelve una duda concreta o aporta información necesaria para actuar.
- Evitar subtítulos, antetítulos, etiquetas decorativas, ayudas y avisos que repitan una acción, un estado o información ya visible. No llenar espacios vacíos con texto.
- Usar etiquetas y acciones breves, específicas y suficientes por sí mismas.
- Mantener las etiquetas necesarias para accesibilidad, los errores específicos y la información de privacidad o confirmación necesaria. Presentarla en el lugar oportuno y sin duplicaciones.
- Antes de aprobar una pantalla, revisar cada texto secundario: si eliminarlo no cambia la comprensión, la accesibilidad ni la capacidad de decidir, eliminarlo.

## Vocabulario del observatorio

Usar «reporte» en navegación, formularios, catálogo, estados y mensajes. Acciones: «Enviar un reporte» y «Ver reportes». Preferir «captura o imagen» a «evidencia». El envío documenta una situación para el observatorio; no presentarlo como una denuncia penal. Aclararlo una vez en el formulario, sin repetir advertencias legales en cada control.
