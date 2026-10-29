# Revisión de preparación para producción — 29-10-2026

## Dictamen

**La funcionalidad actual está validada; todavía no se recomienda abrir el servicio al público con datos reales.** La decisión no depende de contar ya con dominio o proveedor de alojamiento. Hay pendientes concretos de administración de contenido, datos y operación.

Esta revisión no es un despliegue ni una certificación de seguridad o cumplimiento jurídico. Se conservaron las cuentas, reportes y configuración de localhost:3000. Las pruebas utilizaron información ficticia y un proveedor IA simulado en una base aislada, sin llamadas externas a OpenAI.

## Actualización posterior — gestión de publicaciones

Implementados y comprobados después de la auditoría: corrección del texto y apartados públicos, retirada y republicación expresa por revisoras, motivo e historial privados, control de versiones y retirada conjunta de imagen. Una imagen retirada no reaparece al republicar. El original y la revisión interna se conservan. La migración 014 preserva aprobaciones anteriores con su persona y fecha originales.

Los cinco logos se mantienen; únicamente lc4 enlaza a https://www.fundacionoxlajujnoj.org/ y lc5 a https://tecsify.com/. No quedan enlaces provisionales en esos logos.

El usuario confirma atención de solicitudes por correo institucional en 15 días desde su recepción. Conservación/supresión y revisión jurídica siguen pendientes. Aviso v3 para nuevos envíos, conservando sin alteración los consentimientos v1/v2.

Validación del incremento: TypeScript correcto; **36/36 pruebas de servidor**, sin omisiones, en una base temporal aislada; los dos recorridos de inicio y los dos nuevos de publicaciones aprobados entre ejecución y repetición focalizada. Estos últimos comprueban acceso401/403, origen, confirmaciones, versión obsoleta, concurrencia, corrección de apartados, retirada de catálogo/detalle/imagen, conservación del original y nueva aprobación sin recuperar la imagen. El recorrido de interfaz conserva controles funcionales con el refresco suspendido. No se repitió la suite completa de 62 escenarios.

Compilación de producción del incremento correcta: `observadoras-production-check:publication-management-20261029`, SHA256 `ecf93edb6fc62a8867b3f2564a43941e9f9607c5e184e14867d4df4da030c0d3`. Se conserva el entorno principal con recarga en3000; las pruebas aisladas quedan detenidas sin eliminar volúmenes.

Credenciales: pendiente la elección solicitada al usuario entre generación segura en archivo privado local o cambio personal desde Usuarios. No se restableció la contraseña ni se cerraron sesiones de la cuenta real sin esa definición.

Los respaldos están excluidos expresamente de este incremento. El análisis de vulnerabilidades del sistema operativo con Docker Scout sigue pendiente de autenticación. No se declara preparación definitiva para producción mientras subsistan estas condiciones y las decisiones institucionales.

La tabla siguiente conserva los hallazgos de la auditoría original; los puntos de publicaciones y enlaces quedan sustituidos por esta actualización.

## Pendientes para autorizar la apertura

| Prioridad | Hallazgo confirmado | Cierre necesario |
|---|---|---|
| Alta | La base local conserva una cuenta administradora activa cuya contraseña coincide con una contraseña de prueba conocida. | Cambiar las credenciales o excluir las cuentas de prueba antes de transferir esta base. No se cambiaron contraseñas durante la auditoría. Una instalación nueva no crea automáticamente esa cuenta. |
| Alta | La interfaz permite retirar una imagen pública, pero no corregir ni retirar el texto de una publicación ya aprobada. El aviso ofrece un canal de solicitud de corrección/retirada. | Definir e implementar el mecanismo autorizado para atender esas solicitudes con trazabilidad. No depender de modificaciones manuales de la base como procedimiento ordinario. |
| Alta | Siguen sin definirse plazos y criterios de conservación/supresión, atención de derechos y condiciones institucionales finales del tratamiento con IA. | Aprobación de la Fundación y revisión jurídica del aviso/procedimientos. El consentimiento del formulario no sustituye estas decisiones. No se afirma anonimización automática de descripción o captura. |
| Alta, operación | Se comprobó restauración técnica, pero no existe una política operativa de respaldos verificada para el servicio público. | Establecer responsable, frecuencia, destino protegido, retención y ensayo periódico de recuperación. El respaldo debe incluir evidencia privada e imágenes públicas almacenadas en PostgreSQL. |
| Cierre editorial | Los cinco logos suministrados ya sustituyen la imagen provisional, pero sus enlaces siguen apuntando a example.com por indicación del usuario. | Sustituirlos por los cinco destinos definitivos antes de la publicación institucional. |

Las decisiones institucionales pendientes ya se registran en `DECISIONES_PENDIENTES.md`; esta revisión no inventa políticas ni atribuye aprobación a la Fundación.

## Comprobaciones ejecutadas

| Comprobación | Resultado y alcance |
|---|---|
| Compilación empaquetada | Dos builds correctos: base auditada y versión final con los cinco logos. Next.js y TypeScript sin errores. |
| TypeScript local | `npx tsc --noEmit`, correcto. |
| Pruebas de servidor | **35/35 aprobadas**, sin omisiones, en imagen de producción y PostgreSQL aislado. Ejecución serial para no disputar una misma cola entre archivos de integración. |
| Suite de navegador | Ejecución completa: **59/62 aprobadas**. Tres fallos correspondían a una expectativa obsoleta del simulador, un selector anterior al rediseño y sincronización de teclado durante una transición de Driver.js. |
| Revalidación focalizada final | **5/5 aprobadas**: los tres casos corregidos y las dos pruebas de inicio con los logos nuevos. Los 62 escenarios quedaron comprobados entre ambas ejecuciones; no se presenta esto como una única ejecución final de 62/62. |
| Dependencias de ejecución | `npm audit --omit=dev --json`: **0 vulnerabilidades conocidas reportadas** en esa consulta. No incluye paquetes del sistema operativo. |
| Compose de entrega | `docker compose -f compose.yaml config --quiet`, correcto. El archivo explícito omite el override de desarrollo. |
| Configuración de imagen final | `NODE_ENV=production`, usuario UID1000, sin archivos `/app/.env` ni `/app/.env.dev` dentro de la imagen. |
| Cabeceras de servidor final | HTTP200; CSP sin unsafe-eval; X-Content-Type-Options nosniff; X-Frame-Options DENY. |
| Recuperación de PostgreSQL | `pg_dump -Fc` y `pg_restore --exit-on-error` correctos en una base temporal con datos ficticios: 17 tablas públicas, 38 reportes y 18 publicaciones en la instantánea. Se eliminó únicamente la base temporal de restauración. |
| Entorno habitual | localhost:3000 devuelve HTTP200 y sirve los cinco logos nuevos con recarga de desarrollo. |

Los recorridos de navegador cubren recepción pública y captura obligatoria, separación de original/publicación, aprobación y retirada de imágenes, permisos, estados y concurrencia, revisión humana, IA simulada y fallos del proveedor, seguimiento, borradores de alertas, panel agregado, nombres y administración de cuentas, revocación de sesiones, tutoriales, límites de acceso y vistas móviles/escritorio.

En particular, pasaron los casos de aprobación de imagen y de seguimiento/borrador con refresco de página demorado y recuperación de escrituras fallidas, vinculados a los bloqueos reportados anteriormente.

## Cambios realizados durante la revisión

- Aislamiento de contadores de límites entre pruebas de navegador, exclusivamente en el proyecto/base/proveedor simulados y con comprobaciones explícitas de seguridad. Los límites reales de la aplicación no se modificaron; su prueba de rechazo por exceso pasó.
- Ejecución serial de pruebas de integración de servidor para evitar que dos archivos consuman la misma cola.
- Actualización de expectativas, selectores accesibles y espera por fotogramas del tutorial; el simulador permite información sensible ficticia en el análisis inicial autorizado, como hace el comportamiento acordado. Se conservan las restricciones del análisis complementario.
- Integración autorizada de lc1.webp–lc5.webp en inicio, con nombres accesibles correspondientes. Los enlaces permanecen provisionales.

No se agregaron funcionalidades ni se modificó la política de bloqueo de la IA de la aplicación durante esta auditoría.

## Evidencia técnica local

Imagen final: `observadoras-production-check:final-20261029`.

SHA256: `b5086ef43acc982771adafe2c27f2dc1b08ebbdfd6496b313267b554f644a24e`.

La suite amplia y las 35 pruebas de servidor se ejecutaron sobre la imagen base `db7a56f6b1602453c20d738537ebf1719c3275668e3f32a87e3e7df7bf712c0c`. La versión final incorpora cambios de tests/simulador y logos; las cinco comprobaciones focalizadas y las cabeceras/configuración se verificaron sobre la imagen final.

Registros locales ignorados por Git:

- `artifacts/production-unit-tests-serial.log`
- `artifacts/production-e2e-isolated.log`
- `artifacts/production-e2e-final-focus.log`
- `artifacts/production-final-build.log`
- `artifacts/production-container-cves.log`

## Límites de esta revisión y entrega

- Docker Scout está instalado, pero rechazó el análisis por falta de sesión autenticada. **No se completó un análisis de vulnerabilidades del sistema operativo de la imagen.** No se inició sesión ni se alteró la configuración de Docker.
- OpenAI real, calidad del análisis sobre casos reales y condiciones comerciales/institucionales del proveedor no se revalidaron. La integración y los fallos se probaron con simulador.
- Navegador Chromium con tamaños móviles/escritorio; no equivale a una prueba en Safari o dispositivos físicos. No se hizo prueba de carga, pentest externo ni auditoría integral de accesibilidad.
- La configuración pública necesita origen exacto, HTTPS, cookies seguras, secretos propios y política de proxy. Son requisitos de la instalación final, no una solicitud de contratar o seleccionar alojamiento durante esta revisión.
- Usar `-f compose.yaml` para entregar la imagen de producción; el comando Compose por defecto conserva la experiencia local con recarga solicitada por el usuario.
- El entorno aislado de pruebas se detiene al finalizar, sin borrar volúmenes. localhost:3000 conserva su configuración y datos.
