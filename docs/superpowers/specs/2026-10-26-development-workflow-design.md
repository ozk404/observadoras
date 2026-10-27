# Desarrollo y validación proporcionales

Implementar el flujo aprobado: entorno Docker persistente en localhost3100 con recarga; producción3000 sin cambios de datos ni reinicios por edición. Compose propio, PostgreSQL/volúmenes propios y .env.dev generado con secretos aleatorios. No importar .env ni montar la raíz que contiene secretos: montar solo código/configuración/recursos requeridos. OpenAI simulado local según guardas existentes; worker opcional perfil ai.

Usar imagen Node22 existente, volumen Linux node_modules y un servicio deps que instala solo si cambia lockfile/Node/plataforma; sin builds de producción durante iteración. Next dev webpack con polling para bind mounts Windows. CSP habilita eval/WebSocket únicamente en desarrollo; producción conserva su política.

Un comando Node para up/down/logs/ui/auth, sin borrar volúmenes. UI no crea cuentas. Runner autenticado conserva perfil all por defecto y añade core explícito con cuatro cuentas; mantener secretos stdin y deshabilitación final. Documentar matriz CSS/copy→visual, interacción→pruebas focalizadas, API/permisos→integración. Producción: un build final y solo app para cambios frontend, worker/migración según alcance. No repetir por rutina ni generar specs/revisiones/commits por microajuste visual autorizado.

Validar Compose, aislamiento (DB y ausencia de .env en montajes), salud/lectura, HMR mediante edición temporal reversible, CSP dev/prod, UI focalizada y perfil core con limpieza de cuentas. No cambiar volumen de producción ni llamar proveedor real. Documentación operativa única; si una corrección de compatibilidad toca fuentes de runtime, efectuar un único build final y actualizar solo app.

Ajuste tras prueba real en Windows: Turbopack no detecta cambios del bind mount; se usa Webpack con polling. Detecta CSS en ~5s pero puede recargar la página completa y perder valores no enviados; documentarlo sin prometer preservación. Corregir tres selectores globales del módulo para que sean puros, sin cambiar su alcance visual.

Se detectó interacción antes de hidratación en formularios privados durante pruebas de carga lenta. Bloquear controles hasta estar listos y respaldar formularios con POST; validar login/borrador sin JS y flujo completo. Ajustar timeout solo del entorno dev para compilación de rutas. Reset de contadores solo de observadoras_dev con guardas, no de producción.
