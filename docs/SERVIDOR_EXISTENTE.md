# Servidor de observadoras.tecsify.com

## Despliegue en un comando

Después de actualizar el repositorio en el servidor existente, ejecutar:

```bash
bash scripts/deploy-server.sh
```

Compila, migra, crea admin/admin únicamente si la cuenta no existe, arranca en producción con red persistente, valida/recarga el Caddy existente y comprueba HTTPS. No restablece contraseñas existentes ni recrea PostgreSQL. Verifica primero la imagen y el volumen actuales y se detiene ante diferencias. Si falta el bloque de dominio, lo añade conservando una copia del Caddyfile y restaura el archivo si la validación falla. DNS debe estar configurado. Un fallo posterior no revierte migraciones ni elimina datos; corregir la causa y repetir el mismo comando. La contraseña inicial admin/admin es la excepción solicitada por el propietario; puede cambiarse desde Usuarios y no reaparecerá en despliegues posteriores.

## Operación manual de referencia

Este servidor comparte únicamente el proxy Caddy existente con Referente. No iniciar el servicio proxy de compose.production.yaml. PostgreSQL mantiene postgres:17-bookworm y el volumen observadoras_postgres_data; no ejecutar down -v ni cambiar el nombre del proyecto.

Desde la carpeta observadoras, después de actualizar el código:

```bash
docker compose -f compose.yaml -f compose.server.yaml config --quiet
docker compose -f compose.yaml -f compose.server.yaml build app
docker compose -f compose.yaml -f compose.server.yaml run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.server.yaml up -d --no-deps app ai-worker
docker exec referente_caddy wget -S -O /dev/null http://observadoras-web:3000/api/health
curl -I https://observadoras.tecsify.com/
```

Los comandos conservan la base en ejecución. La migración debe terminar correctamente antes de continuar. Seleccionar ambos archivos explícitamente excluye compose.override.yaml y sus montajes/arranque de desarrollo. La compilación ocurre antes de sustituir app y worker. El alias del proxy persiste al recrear app; solo app se conecta a referente_net, la base y el worker permanecen en su red privada.

El Caddyfile existente /home/shapersjalapa/wp-s/Site/Caddyfile debe conservar los dominios de Referente y añadir:

```caddyfile
observadoras.tecsify.com {
    reverse_proxy observadoras-web:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

Validar antes de recargar:

```bash
docker exec referente_caddy caddy validate --config /etc/caddy/Caddyfile
docker exec referente_caddy caddy reload --config /etc/caddy/Caddyfile
```

El registro A debe apuntar a 136.64.154.138 y TCP 80/443 debe ser accesible. Verificar ingreso y envío desde HTTPS después del cambio. La validación local del Compose no verifica el servidor remoto ni sus certificados.
