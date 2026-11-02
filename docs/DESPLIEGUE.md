# Entrega de producción

La entrega usa Next.js compilado, Node 22 y PostgreSQL 17 con imágenes Alpine fijadas por digest. El entorno local conserva su base, sus cuentas y la recarga en localhost:3000. No se ha desplegado en un servidor público.

## Instalación en el servidor

### Acceso público con HTTPS incluido

Para `observadoras.tecsify.com`, crear el registro DNS A `observadoras` apuntando a `136.64.154.138`. Si existe un registro AAAA, debe apuntar también al servidor correcto o retirarse. Permitir TCP 80 y 443 tanto en el firewall del proveedor como en el servidor; esos puertos deben estar libres de otros proxies.

En `.env`, agregar `SITE_DOMAIN=observadoras.tecsify.com`. Iniciar con ambos archivos explícitos:

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d --build
docker compose -f compose.yaml -f compose.production.yaml ps
curl -I https://observadoras.tecsify.com/
```

Si la aplicación ya está compilada y en ejecución, aplicar solo el acceso público sin reconstruir ni recrear PostgreSQL:

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d --no-deps app
docker compose -f compose.yaml -f compose.production.yaml up -d --no-deps proxy
docker compose -f compose.yaml -f compose.production.yaml logs --tail=50 proxy
```

Caddy obtiene y renueva el certificado automáticamente y redirige HTTP a HTTPS. Requiere DNS público correcto y acceso entrante a los puertos indicados. Sus certificados persisten en `caddy_data`. La aplicación conserva 3000 en loopback; el proxy se conecta por la red interna de Docker y sustituye `X-Real-IP`. Este override fija el origen HTTPS, las cookies seguras y la confianza en ese proxy. No incluir `compose.override.yaml` en el servidor. No cambiar de proyecto Compose ni eliminar volúmenes al actualizar una instalación existente.

Verificar después ingreso y envío de reportes desde HTTPS. Validar la configuración localmente no confirma DNS, firewall o certificados del servidor.

### Instalación con proxy externo ya existente

1. Preparar un archivo `.env` privado usando `.env.example` como referencia y secretos propios. No incluirlo en Git ni en la imagen.
2. Configurar `APP_ORIGIN` con el origen HTTPS exacto y `COOKIE_SECURE=true`. El puerto 3000 se publica solo en 127.0.0.1; HTTPS debe terminar en un proxy del servidor. Activar `TRUST_PROXY` únicamente si ese proxy controla y sustituye las cabeceras de conexión.
3. Configurar OpenAI en el servidor para análisis real: `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_DATA_MODE=consented`, `AI_AUTOMATIC_ENABLED=true`. No habilitar `AI_TEST_MODE` ni endpoints de simulación en producción. La revisión manual permanece disponible si el proveedor falla.
4. Iniciar explícitamente sin el override local:

```powershell
docker compose -f compose.yaml up -d --build
docker compose -f compose.yaml ps
```

La migración se ejecuta antes de la aplicación. Deben quedar saludables `db` y `app`; `ai-worker` debe estar en ejecución. No ejecutar `down -v`.

## Cuentas

En una instalación nueva no hay cuentas ni contraseñas predeterminadas. Crear una cuenta y concederle administración desde la consola del servidor:

```powershell
$credential = Get-Credential -UserName admin
$credential.GetNetworkCredential().Password | docker compose -f compose.yaml exec -T app npm run user -- create admin reviewer "Administrador"
docker compose -f compose.yaml exec -T app npm run user -- grant-admin admin
```

Usar una contraseña de 14–128 caracteres. Nunca pasarla como argumento de consola ni publicarla en un chat. Si se importan cuentas existentes, conservar la cuenta de prueba fue una decisión del usuario para el entorno actual; sustituir esa contraseña desde Usuarios antes de habilitar acceso público al área privada. Un restablecimiento cierra sus sesiones.

## Datos existentes

Producción usa el volumen `production_data`; el desarrollo local mantiene `postgres_data` con su imagen anterior. **Una instalación nueva empieza vacía.** Esta separación evita reutilizar físicamente datos de PostgreSQL entre sistemas con bibliotecas C y reglas de ordenación distintas.

Para trasladar registros existentes se debe planificar una exportación/importación lógica de PostgreSQL 17 y comprobar cuentas, reportes, evidencia privada e imágenes públicas antes de cambiar el tráfico. No copiar físicamente el volumen antiguo ni suponer que el comando anterior migra los datos. Ese traslado de datos reales no se ejecutó como parte de la preparación técnica.

## Comprobación de salida

- Verificar HTTPS, ingreso, permisos, envío con captura, recepción de análisis y aprobación humana.
- Comprobar que corrección y retirada afecten la versión pública y conserven el original privado.
- Confirmar el correo institucional y la atención en 15 días. Los reportes no caducan ni se eliminan automáticamente.
- Revisar los hallazgos medios documentados en `ESCANEO-ENTREGA-2026-10-29.md`. El escaneo no equivale a un pentest ni a una revisión jurídica.

Los respaldos permanecen fuera de este incremento por instrucción del usuario. Su exclusión no implica que exista una operación periódica de recuperación configurada.
