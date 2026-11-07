# Observatorio de Violencia Política Digital

Plataforma de monitoreo ciudadano de Fundación Oxlajuj N’oj, en el marco del Programa Paridad 2026. Permite documentar violencia política digital, desinformación y barreras a la participación política de las mujeres en Guatemala.

La aplicación usa Next.js, TypeScript y PostgreSQL con Docker Compose. El servicio de análisis con OpenAI es opcional.

## Uso de la plataforma

| Ruta | Función |
| --- | --- |
| `/` | Presentación del Observatorio y del Programa Paridad 2026. |
| `/reportar` | Envío sin cuenta con descripción, captura obligatoria y enlace opcional. |
| `/reportes` | Catálogo y fichas de versiones aprobadas para publicación. |
| `/ingreso` y `/equipo` | Acceso y revisión privada, seguimiento y gestión de publicaciones. |
| `/equipo/dashboard` | Resumen agregado para revisoras. |
| `/equipo/usuarios` | Administración de cuentas para personas con el permiso correspondiente. |
| `/privacidad` | Aviso de privacidad y condiciones de envío. |

El equipo puede validar un reporte internamente y decidir después si publica una versión separada. Puede corregirla, retirarla y aprobarla nuevamente. Las imágenes públicas requieren aprobación explícita y se guardan como copias independientes. Los originales y el historial de revisión permanecen privados.

Con OpenAI configurado, el envío autorizado pone en cola el análisis de la descripción y la captura. La recepción no espera al proveedor. Las sugerencias se muestran a las revisoras, quienes deciden la clasificación, el seguimiento y la publicación.

## Arranque local

Instala Node.js 22 y Docker con Compose v2. Desde la raíz del repositorio, en la primera instalación:

```bash
node scripts/setup-env.mjs
docker compose build app
node scripts/dev.mjs up
```

Abre [http://localhost:3000](http://localhost:3000). El script crea `.env` solo si falta. Compose monta el código para recarga automática y conserva los datos en `postgres_data`. Repite el build al cambiar dependencias. Usa `node scripts/dev.mjs down` para detener la app y el worker.

## Despliegue

Elige la configuración según el servidor. Los archivos indicados explícitamente con `-f` dejan fuera el override de desarrollo.

| Destino | Configuración | Datos |
| --- | --- | --- |
| Servidor nuevo con HTTPS administrado por el proyecto | `compose.yaml` y `compose.production.yaml`. Caddy usa los puertos 80 y 443. | PostgreSQL 17 Alpine y volumen `production_data`. |
| Servidor actual de `observadoras.tecsify.com` | `compose.yaml` y `compose.server.yaml`. Reutiliza el Caddy compartido y su red. | PostgreSQL 17 Bookworm y volumen existente `observadoras_postgres_data`. |

### Servidor nuevo

1. Apunta el DNS del dominio al servidor y habilita TCP 80 y 443.
2. Prepara un `.env` privado con [.env.example](.env.example) como referencia. Define las credenciales de PostgreSQL, `DATABASE_URL` con el host `db`, un `AUTH_SECRET` aleatorio de al menos 32 caracteres y `SITE_DOMAIN` sin esquema. Usa las mismas credenciales en PostgreSQL y en la URL. Codifica los caracteres especiales de la contraseña en la URL.
3. Si habilitas análisis, configura `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_DATA_MODE=consented` y `AI_AUTOMATIC_ENABLED=true`. Mantén desactivado el proveedor simulado.
4. Arranca y verifica el estado.

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d --build --wait
docker compose -f compose.yaml -f compose.production.yaml ps
```

Compose ejecuta las migraciones antes de iniciar la app y el worker. `SITE_DOMAIN` fija el origen de la app y el dominio que Caddy sirve por HTTPS. Crea la primera cuenta con los pasos de [cuentas y despliegue](docs/DESPLIEGUE.md#cuentas).

### Servidor actual

Conserva el `.env` del servidor, el nombre del proyecto Compose y el volumen existente. Desde el repositorio actualizado, ejecuta `bash scripts/deploy-server.sh`. El script compila, migra, inicializa la cuenta administrativa si falta, inicia los servicios y verifica el acceso por el Caddy existente. Consulta los requisitos en la [guía del servidor actual](docs/SERVIDOR_EXISTENTE.md).

Si la imagen de la versión que quieres ejecutar ya está construida y Caddy ya está configurado, puedes levantar los servicios con `docker compose -f compose.yaml -f compose.server.yaml up -d --no-build`.

El cambio de servidor o de imagen de PostgreSQL requiere planificar una exportación e importación lógica de los datos existentes. Evita `docker compose down -v`, que elimina los volúmenes del proyecto.

## Cuentas y privacidad

El acceso del equipo es cerrado. El permiso de administración de usuarios es independiente del rol de revisión. Las instalaciones locales y nuevas crean su primera cuenta explícitamente. El script del servidor actual tiene su propio arranque de administración. Cambia su contraseña inicial desde Usuarios y consulta la [guía de cuentas](docs/DESPLIEGUE.md#cuentas) para recuperación.

La Fundación administra la información. Las solicitudes se atienden por correo en un plazo de 15 días. Toda eliminación definitiva es manual y autorizada. Retirar una publicación conserva el reporte original privado. Los respaldos quedan fuera del alcance de esta entrega. Consulta el [aviso vigente](docs/avisos/2026-10-29-reports-v3.txt).

## Verificación de entrega

- Comprueba que PostgreSQL y la app estén saludables, que las migraciones terminen y que el worker esté en ejecución.
- En el dominio HTTPS, abre `/api/health` y verifica que responde HTTP 200. Comprueba también Inicio, el logo y la tipografía.
- En un entorno autorizado con datos ficticios, verifica ingreso, envío con captura, revisión, publicación y retirada. Comprueba que las rutas públicas solo muestran la versión aprobada y que la retirada oculta su contenido e imagen.

Para pruebas automatizadas, usa el entorno aislado de [desarrollo y validación](docs/DESARROLLO_Y_VALIDACION.md). El puerto `3100` se reserva para pruebas con datos ficticios y proveedor simulado.

## Documentación

- [Estado funcional y verificaciones](docs/ESTADO_ACTUAL.md)
- [Especificación del proyecto](docs/PROJECT.md) y [flujos y datos](docs/FLUJOS_Y_DATOS.md)
- [Despliegue y cuentas](docs/DESPLIEGUE.md) y [servidor actual](docs/SERVIDOR_EXISTENTE.md)
- [Escaneo histórico de la entrega](docs/ESCANEO-ENTREGA-2026-10-29.md)
- [ADN visual](docs/ADN_VISUAL.md)

El código de rutas está en `src/app`, los componentes en `src/components`, las reglas de negocio en `src/server`, las migraciones en `db/migrations` y los comandos operativos en `scripts`.
