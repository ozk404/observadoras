# Fase 1 — Resultado de verificación local

Fecha: 25 de octubre de 2026. Entorno: Windows, Docker Desktop Linux y Chromium. Datos exclusivamente ficticios. No constituye despliegue ni aceptación institucional.

## Implementado

- Index con accesos de registro y catálogo, identidad basada en el ADN, fuente Manrope autoalojada propuesta y sin logos inventados.
- Formulario público `/denuncia`, original privado y estado pendiente, límites de tamaño/frecuencia, origen, token temporal, campo trampa e idempotencia.
- Acceso cerrado por sesión, cuentas habilitadas por comando, roles participante/revisora, deshabilitación y cierre de sesión.
- Borrador persistente, listado y detalle restringidos, envío explícito y control de concurrencia por versión. Revisores no ven borradores ajenos.
- Revisión/publicación manual básica: título y texto públicos separados, confirmaciones explícitas, transacción y persona/fecha de publicación.
- Catálogo y detalle consultan solo publicaciones. No exponen originales ni identidades internas.
- PostgreSQL persistente, migraciones versionadas repetibles y Docker Compose; aplicación accesible solo por localhost en esta configuración.

## Comprobaciones

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | Código 0 |
| `npm test` | Código 0, 6 pruebas aprobadas |
| `npm run build` local | Código 0; el primer intento restringido falló al crear un enlace de Turbopack y se repitió con los permisos necesarios |
| `docker compose up --build -d` | Código 0, build de producción aprobado |
| `docker compose config --quiet` | Código 0 |
| `docker compose exec -T app npm run db:migrate` | Código 0 en repetición, sin reaplicar migraciones |
| `docker compose exec -T app npm test` | Código 0, 6 pruebas aprobadas dentro del contenedor |
| `node scripts/test-e2e.mjs` | Código 0, 4 escenarios Chromium aprobados sobre imagen actualizada |
| `docker compose ps` | Aplicación y PostgreSQL saludables |
| Revisión visual | Capturas de index en escritorio/móvil, formulario y revisión privada inspeccionadas |

Los escenarios de navegador comprueban envío → publicación humana; original ausente del catálogo; reintento sin duplicado; confirmación de privacidad obligatoria; rechazo de republicación; cierre de sesión; persistencia de borrador; rechazo de lectura/edición ajena por API; participante sin permiso de publicación; borradores ajenos invisibles incluso para revisores; versiones obsoletas rechazadas; bloqueo de edición tras envío; cuenta deshabilitada; origen ausente rechazado; exceso de tamaño y frecuencia; ausencia de desbordamiento a 390 px y navegación inicial por teclado.

Se verificó en PostgreSQL la persona/fecha de las publicaciones y los eventos de creación/envío/publicación. Al terminar se retiraron exclusivamente los cuatro registros ficticios creados por las dos ejecuciones y sus publicaciones/eventos. Las ocho cuentas de prueba quedaron deshabilitadas. El catálogo queda vacío hasta que se apruebe contenido nuevo.

## Límites y siguiente puerta

La fase 1 está implementada y verificada localmente para el alcance acordado. Faltan aceptación visual/funcional del usuario y condiciones institucionales antes de datos reales: ficha definitiva, conservación, canal de derechos, reglas/operación de retirada pública, matriz completa de acceso, activos oficiales, HTTPS, proxy confiable, respaldos y alojamiento. Los límites técnicos contra abuso son provisionales y requieren ajuste operativo.

No incluye IA, archivos adjuntos, dashboard, devolución/cierre ni seguimiento avanzado. No se verificaron pruebas institucionales anteriores ni se desplegó producción. La fase 2 solo comienza con indicación expresa del usuario.
