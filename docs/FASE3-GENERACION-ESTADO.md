# Punto de reanudación — 26-10-2026

**Resuelto tras el reinicio:** Docker recuperado, limpieza autorizada de caché terminada y generación de alertas validada y actualizada en localhost. Pasaron 29/29 pruebas de servidor con PostgreSQL y 28/28 recorridos de navegador. Salud HTTP 200, permisos sin sesión HTTP 401 y conteos conservados. Ver `FASE3-GENERACION-VERIFICACION.md` para la evidencia final. El resto de este archivo conserva el punto de interrupción histórico; sus pendientes ya se resolvieron.

## Trabajo actual

Generación de propuestas de alerta con OpenAI implementada en código: texto preparado y confirmado ficticio, salida estructurada de título/texto/limitaciones, propuesta privada separada del borrador, uso y guardado explícitos, procedencia, cuotas, vencimiento y control de permisos/versiones al iniciar y finalizar. Diseño revisado y guardado en commit `de21d3a`, en `superpowers/specs/2026-10-26-alert-generation-design.md`.

Archivos nuevos principales: migración 009, `src/server/alert-generations.ts`, endpoint `generacion-alerta`, `src/components/alert-generation-form.tsx` y pruebas de generación/recuperación. También se ampliaron contrato/procedencia de borradores, adaptador Responses, proveedor simulado, fixtures y privacidad. Hay cambios anteriores sin commit: preservarlos; no limpiar, revertir ni sobrescribir el árbol.

## Verificado

- TypeScript: salida 0.
- Pruebas locales en serie: `npx tsx --test --test-concurrency=1 tests/*.test.ts`, salida 0; 26 aprobadas y 3 de PostgreSQL omitidas, 29 en total. La ejecución paralela del host falló al crear procesos (`spawn UNKNOWN` / `ERR_WORKER_INIT_FAILED`); no confundir con una prueba funcional fallida.
- Next.js compiló, completó TypeScript y generó páginas en Docker. La construcción NO terminó de copiar/exportar la imagen: se canceló por falta de espacio. No hay imagen nueva confirmada ni actualización del entorno local.
- Una llamada real al adaptador, con `node --env-file=.env --import tsx`, usó únicamente texto ficticio creado para la prueba: esquema válido, cero señales identificables, título de 71 caracteres, cuerpo de 944 y limitaciones de 344. Ninguna lectura de denuncias ni escritura de borradores. No repetir por rutina ni imprimir secretos.

## Incidencia del entorno

C: quedó con unos 40 MiB libres y Docker devolvió errores 500. El usuario autorizó explícitamente limpiar solo caché de compilación y reiniciar Docker, conservando código, volúmenes y bases de datos. El comando `docker builder prune --all --force` falló al conectar; NO se confirmó limpieza de caché.

Se canceló la construcción propia, se reinició Docker Desktop y se terminó únicamente la distribución `docker-desktop` para recuperar el motor. No se eliminaron imágenes, contenedores, volúmenes ni archivos del proyecto. Se liberaron varios GB temporales al detener Docker, pero el motor quedó detenido. Un arranque registró `WSL update required`; la CLI mostró WSL 3.0.3, kernel 6.18.54.1-1 y Docker Desktop 4.32.0. No se ejecutó actualización de WSL ni de Docker. El último controlador indicó que Linux ya era el motor seleccionado, sin arrancarlo.

La inspección de ventanas tampoco estuvo disponible: los dos REPL devolvieron `failed to write kernel assets ... (os error 3)`. Se pidió al usuario arrancar Docker desde su ventana y decidió reiniciar el PC. No asumir que localhost está disponible mientras Docker esté detenido ni que las bases se verificaron después de esta incidencia.

## Después del reinicio

1. Comprobar espacio libre y `docker version`/`docker compose ps`. Recuperar servicios existentes sin eliminar datos. Si sigue bloqueado, obtener el error actual antes de instalar o cambiar software; la autorización previa solo cubre caché y reinicios.
2. Limpiar únicamente la caché de compilación autorizada cuando el motor responda. Comprobar espacio físico suficiente antes de reconstruir; no usar `system prune`, `volume prune`, `down -v`, restablecimientos ni borrado de VHD.
3. Construir la imagen completa incluyendo el cambio pendiente de texto de privacidad. Iniciar Compose aislado, proyecto sugerido `observadoras-alert-generation-test`, con `compose.ai-test.yaml` y puerto 3100.
4. Ejecutar las 29 pruebas de servidor con PostgreSQL (incluye recuperación/vencimiento y revocación de revisora durante generación), preferentemente en serie si persiste el límite de procesos. Ejecutar los 28 recorridos con `TEST_AI=true`, `TEST_BASE_URL=http://localhost:3100`, `TEST_COMPOSE_FILE=compose.ai-test.yaml`, `TEST_COMPOSE_PROJECT=observadoras-alert-generation-test`, usando `node scripts/test-e2e.mjs`.
5. Corregir fallos, inspeccionar las capturas de generación en escritorio/móvil, completar documentación de fases y verificación, y solo entonces actualizar localhost conservando datos y comprobando salud/permisos. Las cifras anteriores al incidente eran 2 cuentas habilitadas, 4 registros, 1 publicación, 3 evidencias y 0 eventos de seguimiento; no son conteos actuales confirmados tras el reinicio.

La funcionalidad NO está declarada terminada: faltan pruebas completas con base/navegador, imagen final, despliegue local y comprobación de conservación. No habilitar datos reales ni difusión de alertas.
