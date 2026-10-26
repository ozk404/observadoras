# Reportes y contenido real

Autorización del usuario, 26-10-2026: retirar el requisito de contenido ficticio, permitir análisis automático de descripción y captura reales con consentimiento explícito para OpenAI y usar «reporte» para evitar confusión con una denuncia penal. Diseño propuesto y aprobado en el chat.

## Alcance

- Interfaz pública y privada: «Enviar un reporte», «Reportes revisados», «Reporte recibido», «Captura o imagen». Una aclaración contextual indica que el envío informa al observatorio y no presenta una denuncia penal. Evitar avisos redundantes.
- Rutas canónicas `/reportar`, `/reportes`, `/reportes/[id]`. Redirigir las rutas públicas anteriores, conservando identificadores y paginación. API interna existente sin cambio de nombre para limitar regresiones.
- Retirar `syntheticConfirmed` de los contratos de envío y solicitudes preparadas, controles y textos. Mantener consentimiento público obligatorio que nombre a OpenAI, descripción y captura; confirmación de privacidad para texto preparado por revisoras.
- Registrar consentimiento para análisis automático en un campo nuevo, con versión del aviso, sin reinterpretar la declaración ficticia histórica. La migración no autoriza ni encola registros anteriores; reintentos solo con consentimiento nuevo válido. Conservar datos existentes.
- Configuración explícita `AI_DATA_MODE=consented` para operación real y `synthetic` solo para entorno aislado. Modos desconocidos fallan cerrados. No modificar credenciales ni modelo. No procesar datos reales en pruebas ni efectuar llamadas reales para validar.
- Mantener detección de identificadores comunes antes de enviar texto y en resultados, privacidad de imágenes, URL sin consulta ni envío, ausencia de datos privados en logs, cuotas, revisión humana y separación original/publicación. La imagen se analiza con consentimiento; no prometer anonimato ni eliminación de identificadores visibles por normalización.
- Documentar autorización técnica del usuario sin atribuir aprobación institucional. Conservación, derechos, alojamiento y respaldos siguen como decisiones operativas pendientes; no inventar canales ni plazos.

## Verificación

Contratos sin declaración ficticia, consentimiento obligatorio y persistido, ausencia de consentimiento histórico, bloqueo de reintentos sin consentimiento, modo consented válido y modo desconocido bloqueado, navegación/redirecciones y paginación, copy y privacidad. Ejecutar pruebas de servidor con PostgreSQL y suite E2E aislada con fixtures ficticios; revisar móvil/escritorio. Construir imagen y actualizar localhost solo al pasar; comprobar salud, permisos y conservación de conteos.

## Fuera de alcance

Eliminar registros de demostración, modificar originales históricos, decisiones automáticas, publicación de capturas o URL, difusión de alertas y despliegue público.
