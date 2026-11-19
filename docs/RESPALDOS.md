# Exportación completa y restauración

Los comandos requieren Node.js 22, Docker, acceso al contenedor de PostgreSQL y `tar`. Se ejecutan en el host desde la raíz del proyecto. El usuario que los ejecuta debe poder leer `.env` y los archivos del proyecto. En Linux, `tar` está disponible habitualmente en el sistema. La importación admite PostgreSQL de la misma versión mayor que el origen, actualmente 17.

## Exportar

```bash
node scripts/backup.mjs export --container observadoras-db-1 --output backups/observatorio.ovpbackup
```

El comando pide una contraseña de al menos 14 caracteres y su confirmación, con entrada oculta. Conserva esa contraseña por separado. Se necesita para recuperar el respaldo. Usa un nombre de archivo nuevo en cada exportación. El comando rechaza sobrescribir un archivo existente.

El paquete contiene una copia lógica consistente de toda la base, el código del directorio actual, los archivos públicos, el `.env` y un manifiesto con fecha, versión de PostgreSQL, revisión Git, migraciones y hashes SHA-256. Incluye cambios del código presentes en disco aunque aún no estén en Git. La revisión Git identifica el commit de referencia, mientras que el archivo de código representa el contenido exportado.

La base incluye cuentas, hashes de contraseñas, permisos, reportes originales, capturas privadas, publicaciones, imágenes públicas, análisis IA, consentimientos, ajustes, notas, seguimiento e historiales. Se incluyen todas las tablas, también las que se incorporen posteriormente. El paquete conserva las sesiones como parte de la copia completa, pero la importación las invalida.

El cifrado usa AES-256-GCM y una clave derivada de la contraseña con scrypt, con salt e IV aleatorios. La autenticación del cifrado detecta contraseñas incorrectas y alteraciones. El archivo final solo aparece cuando termina la exportación. Los temporales privados se limpian al finalizar. Una interrupción abrupta del host puede dejar directorios `observadoras-backup-*` en el directorio temporal del sistema y un archivo `.partial-*` junto al destino. Su revisión y retirada corresponden a la persona administradora. Reserva espacio para el respaldo y sus archivos temporales antes de una operación grande.

Se excluyen dependencias instaladas, cachés de compilación, `.git`, artefactos de pruebas, respaldos anteriores y otros archivos `.env`. El `.env` principal se incluye por separado dentro del cifrado y `.env.example` se conserva en el código. Las dependencias se reconstruyen a partir de `package-lock.json` y Dockerfile. Los enlaces simbólicos y archivos especiales provocan un error.

El respaldo cubre este proyecto. La configuración y los volúmenes de otros proyectos que compartan servidor o proxy se administran por separado. DNS, reglas de firewall y credenciales del proveedor de alojamiento deben prepararse en el destino. Copia el archivo cifrado fuera del servidor para poder recuperarlo si el host se pierde.

## Importar

Usa un PostgreSQL de destino vacío. El contenedor debe tener definidas `POSTGRES_USER` y `POSTGRES_DB`, y permitir conexión operativa interna con ese usuario. En una instalación nueva, prepara `.env` y levanta solo la base con el Compose correspondiente antes de ejecutar migraciones o iniciar la aplicación.

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d db
node scripts/backup.mjs import --container observadoras-db-1 --input backups/observatorio.ovpbackup --files-to ../observatorio-restaurado
```

`--files-to` debe nombrar un directorio que aún no exista. El comando autentica y descifra el paquete en un directorio temporal privado, verifica hashes, versión de PostgreSQL y rutas del código. Después extrae el proyecto y restaura la base con `pg_restore --single-transaction`. Una base ocupada se rechaza. Un fallo de `pg_restore` revierte su transacción. La extracción del código y las comprobaciones posteriores son pasos separados y pueden dejar el directorio recuperado si falla la operación.

Tras restaurar, el comando elimina las sesiones del destino para exigir un nuevo ingreso, verifica las migraciones e informa cantidades por tabla. Los nombres de usuario, contraseñas, permisos y datos de negocio se conservan. El origen permanece disponible y su base sigue intacta.

En `observatorio-restaurado` quedan el código, `backup-manifest.json` y `.env.reference`. Este último contiene los secretos del servidor anterior. Prepara un `.env` para el destino usando esa referencia, ajustando credenciales de PostgreSQL, host de conexión, dominio y proxy. Conserva los valores de OpenAI únicamente si se utilizará el mismo acceso autorizado. Mantén la aplicación y el worker detenidos hasta terminar esa configuración. Los trabajos IA pendientes o en procesamiento se conservan y el worker aplicará su recuperación habitual cuando arranque.

La restauración no configura los usuarios internos de PostgreSQL del servidor antiguo. Usa las credenciales de la base de destino en `.env`. Las cuentas del equipo del observatorio sí están dentro del respaldo y se restauran con sus hashes y permisos.

Arranca desde el código recuperado con el Compose apropiado y `up -d --build --wait`. En un servidor nuevo se usa `compose.yaml` junto con `compose.production.yaml`. `compose.server.yaml` pertenece al servidor existente y presupone su red y proxy compartidos. Consulta [despliegue](DESPLIEGUE.md) y [servidor existente](SERVIDOR_EXISTENTE.md).

## Traslado definitivo de servidor

1. Prepara el destino y ensaya la importación en una base vacía.
2. Para el corte definitivo, detén la app y el worker del origen. Esto evita escrituras y trabajos nuevos después de la copia final. Mantén PostgreSQL activo.
3. Genera una exportación final con un nombre nuevo y llévala al destino.
4. Restaura esa copia en una base vacía y configura el proyecto recuperado.
5. Comprueba ingreso, permisos, reportes, capturas privadas, publicaciones y retirada antes de dirigir el tráfico al nuevo servidor.
6. Inicia un único worker operativo para la base definitiva y cambia el tráfico. Conserva el respaldo final según el criterio de la Fundación.

Para un respaldo periódico de recuperación, `pg_dump` obtiene una instantánea consistente mientras el sitio opera. Evita desplegar cambios de código o configuración durante la exportación para que correspondan a la base respaldada. Estos comandos son manuales. La programación, almacenamiento remoto y política de retención pueden configurarse posteriormente.

## Verificar el mecanismo

```bash
node --test tests/backup.test.mjs
```

La prueba crea dos PostgreSQL temporales con datos ficticios y comprueba restauración de tablas, relaciones, hashes de cuentas, capturas y archivos públicos, cierre de sesiones, contraseña incorrecta, archivo manipulado y rechazo de una base ocupada. Los contenedores temporales de esa prueba se eliminan al terminar.

Para automatización, la contraseña puede proporcionarse mediante `OBS_BACKUP_PASSWORD` en el entorno del proceso. Evita guardarla en comandos, logs o archivos del repositorio. El uso interactivo la solicita sin mostrarla. `--project-dir` permite seleccionar explícitamente el directorio de código y `.env` al exportar. Si se omite, se utiliza la raíz de este repositorio.
