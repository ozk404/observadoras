# Revisión manual del núcleo funcional

Entorno local: http://localhost:3000. Usar exclusivamente información ficticia. Este recorrido es una guía para la aceptación por el usuario; las pruebas automáticas no sustituyen esa aceptación.

## Acceso

Las dos cuentas ficticias de esta revisión están habilitadas en la base local. Sus usuarios y contraseñas están solo en `.env.review`, archivo excluido de Git y Docker. No copiar sus valores a documentos, capturas o chats. No confundir ese archivo con `.env`, que contiene la configuración del servicio.

Se preparó un único borrador titulado **Prueba ficticia de revisión manual**, propiedad de la cuenta participante. Su ruta está en `REVIEW_DRAFT_PATH` dentro del archivo local. No fue enviado ni publicado.

## Recorrido propuesto

1. Abrir `/` y comprobar claridad de Registrar denuncia, Ver denuncias y Acceso del equipo. Revisar también en móvil.
2. Ingresar como participante en `/ingreso`. Abrir el borrador, editarlo y guardar. Recargar para confirmar persistencia.
3. Enviar ese registro a revisión. Confirmar el cambio a Pendiente y que dejó de ser editable.
4. Cerrar sesión e ingresar como revisora. Abrir el registro recibido y **Devolver para ajustes** con una observación ficticia concreta.
5. Volver como participante. Leer la observación, guardar correcciones y **Reenviar a revisión**. Comprobar que el historial sigue visible y el estado vuelve a Pendiente.
6. Volver como revisora y **Validar sin publicar**. Confirmar persona/fecha y comprobar en otra ventana sin sesión que aún no aparece en el catálogo.
7. Solo si se desea probar la publicación local, preparar un título y texto públicos ficticios independientes. Revisar las confirmaciones y publicar expresamente. Comprobar que aparecen solo esos textos, sin original ni observaciones privadas.
8. Opcionalmente probar `/denuncia` sin sesión con un caso ficticio diferente. Verificar que llega como pendiente al equipo y que no ofrece devolución para ajustes, porque no tiene autora con cuenta.

No es necesario utilizar OpenAI para este recorrido. Solicitar sugerencias, si se prueba después, es una acción distinta que usa la API real configurada; nunca introducir información de personas reales.

## Qué registrar durante la revisión

Anotar ruta, rol, acción, resultado esperado y observado. Priorizar problemas que impidan completar el recorrido, accesos incorrectos, pérdida de información o publicaciones involuntarias. Después revisar claridad de textos, jerarquía visual, errores y adaptación móvil. No incluir credenciales ni datos privados en la evidencia.

## Límites actuales

La ficha sigue siendo mínima; categorías finales y dimensiones institucionales requieren definición. No hay cierre de seguimiento, borradores de alertas ni dashboard. Las condiciones de operación y tratamiento institucional de datos reales siguen pendientes.
