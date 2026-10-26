# Revisión manual del núcleo funcional

Entorno local: http://localhost:3000. Usar exclusivamente información ficticia. Este recorrido es una guía para la aceptación por el usuario; las pruebas automáticas no sustituyen esa aceptación.

## Acceso

Las dos cuentas ficticias de esta revisión están habilitadas en la base local. Sus usuarios y contraseñas están solo en `.env.review`, archivo excluido de Git y Docker. No copiar sus valores a documentos, capturas o chats. No confundir ese archivo con `.env`, que contiene la configuración del servicio.

Se preparó un único borrador titulado **Prueba ficticia de revisión manual**, propiedad de la cuenta participante. Su ruta está en `REVIEW_DRAFT_PATH` dentro del archivo local. No fue enviado ni publicado.

## Recorrido propuesto

1. Abrir `/` y comprobar claridad de Registrar reporte, Ver reportes y Acceso del equipo. Revisar también en móvil.
2. Ingresar como participante en `/ingreso`. Abrir el borrador, editarlo y guardar. Recargar para confirmar persistencia.
3. Enviar ese registro a revisión. Confirmar el cambio a Pendiente y que dejó de ser editable.
4. Cerrar sesión e ingresar como revisora. Abrir el registro recibido y **Devolver para ajustes** con una observación ficticia concreta.
5. Volver como participante. Leer la observación, guardar correcciones y **Reenviar a revisión**. Comprobar que el historial sigue visible y el estado vuelve a Pendiente.
6. Volver como revisora y **Validar sin publicar**. Confirmar persona/fecha y comprobar en otra ventana sin sesión que aún no aparece en el catálogo.
7. Solo si se desea probar la publicación local, preparar un título y texto públicos ficticios independientes. Revisar las confirmaciones y publicar expresamente. Comprobar que aparecen solo esos textos, sin original ni observaciones privadas.
8. Probar `/reportar` sin sesión con una captura sintética, una descripción ficticia y, opcionalmente, una URL. La captura es obligatoria, PNG/JPEG/WebP de hasta 5 MiB; ya no se exige título manual. Verificar que llega como pendiente al equipo, que la revisora puede abrir la imagen y que no ofrece devolución para ajustes, porque no tiene autora con cuenta. Imagen y URL se mantienen privadas incluso al publicar la versión textual. Los borradores internos conservan el formulario previo en este incremento.

No es necesario utilizar OpenAI para este recorrido. Solicitar sugerencias, si se prueba después, es una acción distinta que usa la API real configurada; nunca introducir información de personas reales.

## Qué registrar durante la revisión

Anotar ruta, rol, acción, resultado esperado y observado. Priorizar problemas que impidan completar el recorrido, accesos incorrectos, pérdida de información o publicaciones involuntarias. Después revisar claridad de textos, jerarquía visual, errores y adaptación móvil. No incluir credenciales ni datos privados en la evidencia.

## Límites actuales

La ficha sigue siendo mínima; categorías finales y dimensiones institucionales requieren definición. Hay seguimiento con cierre y borradores privados de alertas; el dashboard y la circulación institucional de alertas siguen pendientes. Las condiciones de operación y tratamiento institucional de datos reales siguen pendientes.

## Borrador de alerta

Como revisora, abrir un registro validado o publicado. En **Borrador de alerta**, escribir título y texto ficticios, guardar y recargar. Editar y guardar de nuevo. Si hay resumen IA, usarlo como base explícitamente, corregirlo y guardar; no se guarda al pulsar esa acción. Comprobar que el borrador permanece privado y que guardar no publica ni cambia la reporte. Si otra revisora edita primero, el guardado antiguo debe rechazarse conservando el texto local. Funciona también con seguimiento cerrado y sin IA disponible.

Para generar texto nuevo, desplegar **Generar con IA**, escribir texto preparado ficticio y confirmar su privacidad. Solicitar propuesta; comprobar que el texto guardado sigue intacto. Pulsar **Usar propuesta**, revisar/editar y guardar por separado. Recargar para verificar propuesta y procedencia; una edición humana posterior del mismo borrador debe seguir guardándose. No usar originales con identificadores ni datos reales. Si otra revisora guarda mientras se genera, el resultado se descarta.

## Seguimiento

Como revisora, abrir un registro validado o publicado. En **Seguimiento**, escribir una nota ficticia, guardar y recargar. Cerrar con motivo y confirmar; comprobar persona/fecha, historial y ausencia del formulario tras el cierre. Si ya estaba publicado, su versión pública sigue visible y sin notas privadas. Una participante no debe ver este panel ni consultar su API. La reapertura queda fuera de este incremento.

## Análisis inicial con captura

En `/reportar`, usar texto y captura enteramente ficticios y aceptar el aviso y autorización de OpenAI. Al abrir esa nueva reporte como revisora, comprobar el panel **Análisis inicial de IA**: estado de procesamiento y, al completar, pertinencia, categorías, observaciones de captura y puntos a revisar. No hay que pulsar Generar para este análisis. Seleccionar la clasificación humana y observación interna al validar; se guardan aparte. La URL no se consulta ni se envía a OpenAI. Un fallo o bloqueo permite continuar manualmente. No se analizan automáticamente los registros previos ni borradores internos.
