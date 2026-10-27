# Administración mínima de usuarios

Autorizado: módulo cerrado de usuarios con nombre, creación de revisoras, edición, activación/desactivación, restablecimiento de contraseña y auditoría. Sin registro público, correo, invitaciones ni servicios nuevos.

- Nombre completo separado de username único e inmutable. Nombre obligatorio en altas web y CLI; cuentas anteriores conservadas con nombre nulo visible como pendiente, nunca inventado.
- Permiso `can_manage_users` independiente del rol actual. No otorga acceso a reportes ni cambia restricciones de borradores. Cuenta existente `admin` habilitada operativamente con CLI explícita tras migración, sin conceder privilegios por nombre desde SQL o login.
- Nuevas cuentas web revisoras; permiso administrativo opcional y explícito. Participantes anteriores conservadas y editables, sin nuevas altas de ese rol desde la interfaz.
- Listado privado paginado, búsqueda por nombre/usuario; nunca devuelve hashes ni secretos. Cambios con versión optimista y origen válido.
- Mutaciones bajo transacción/bloqueo compartido: comprobar de nuevo actor activo administrador, bloquear auto-desactivación/auto-retirada de administración y preservar al menos un administrador activo. Restablecer contraseña revoca sesiones; auto-restablecimiento desde panel prohibido para evitar perder acceso accidentalmente.
- Inicio de sesión crea la sesión bajo bloqueo de fila y comprueba que el hash validado sigue vigente; así un login concurrente con restablecimiento no puede crear una sesión usando la contraseña anterior. Auditoría distingue origen web/operativo.
- Contraseña por entrada explícita >=14 caracteres, nunca en eventos, logs o URLs. Administración entrega fuera de plataforma; no se promete correo ni contraseña temporal con cambio obligatorio.
- Evento guarda actor, destinatario, acción y nombres de campos cambiados, sin contraseñas/cuerpos. UI muestra historial acotado. CLI conserva provisionamiento (nombre obligatorio en altas nuevas; fixtures aportan nombres ficticios explícitos) y añade operaciones de bootstrap; mismos invariantes de bajas administrativas.
- ADN blanco/morado, nombre protagonista y usuario secundario solo donde permite identificar la cuenta. Cabecera muestra nombre con fallback username para cuentas antiguas.
- Validación en PostgreSQL aislado: permisos 401/403, campos estrictos, contraseñas, duplicados, versiones, cierre de sesiones, bootstrap explícito, no auto-bloqueo y operaciones concurrentes. UI con fixtures, escritorio/móvil. Un build final y migración aditiva; solo app recreada, worker conservado.

Cuenta local existente `admin`: nombre de presentación Administrador, según respuesta del usuario; username y rol conservados. Recuperación operativa por CLI reset-password con clave en stdin, misma revocación y auditoría.
