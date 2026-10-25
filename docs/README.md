# Observadoras Digitales — documentación de inicio para Codex

**Proyecto:** Plataforma Digital con Inteligencia Artificial para el Monitoreo Ciudadano  
**Institución destinataria:** Fundación Oxlajuj No’j  
**Programa:** Paridad 2026  
**Estado de esta documentación:** Especificación inicial para orientar la implementación; **no acredita funcionalidades ya construidas ni aprobaciones adicionales**.  
**Actualización:** 25 de octubre de 2026.

## Objetivo de este paquete

Permitir que Codex entienda **qué debe hacer la plataforma, para quién, cómo se usa y qué no debe construir**, antes de elegir o modificar tecnologías.

| Archivo | Propósito |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Reglas operativas para Codex al trabajar en el repositorio. |
| [`PROJECT.md`](PROJECT.md) | Definición del producto, alcance, funciones y requisitos verificables. |
| [`FLUJOS_Y_DATOS.md`](FLUJOS_Y_DATOS.md) | Usuarios, permisos propuestos, pantallas, ciclo de registros, datos y reglas funcionales. |
| [`ADN_VISUAL.md`](ADN_VISUAL.md) | Identidad visual para traducir las referencias institucionales en una interfaz utilizable. |
| [`FASES_DE_IMPLEMENTACION.md`](FASES_DE_IMPLEMENTACION.md) | Orden de construcción y criterios de aceptación por fase. |
| [`DECISIONES_PENDIENTES.md`](DECISIONES_PENDIENTES.md) | Supuestos por validar; Codex no debe convertirlos silenciosamente en compromisos institucionales. |

## Jerarquía de fuentes

1. **TDR de la Consultoría TIC – Programa Paridad 2026:** alcance y restricciones contractuales.
2. **Producto 1 aprobado — Plan de Trabajo y Diseño Técnico-Metodológico:** delimitación vigente del piloto y del dashboard mínimo.
3. **Currícula Observadoras Digitales 2026:** solo como referencia para las sesiones 6 y 7 y los ejercicios vinculados a la herramienta.
4. **Propuesta Técnica de la Plataforma (diagramas UML):** representación orientativa de actores, componentes y secuencia; no justifica por sí sola infraestructura adicional.
5. **Capturas institucionales y color `#69088B`:** referencias del ADN visual.
6. **Este paquete Markdown:** especificación de trabajo. Sus propuestas no sustituyen acuerdos de la Fundación cuando las fuentes anteriores no resuelven algo.

## Principios del producto

- Registrar hallazgos de forma estructurada.
- Utilizar IA **solo como apoyo** y con tratamiento apropiado de la información.
- Mantener la **revisión humana real** antes de validar hallazgos o alertas.
- Mostrar un dashboard **mínimo**, con datos agregados y anonimización comprobable.
- Ofrecer una herramienta web sencilla, accesible y transferible; **no** un sistema de vigilancia ni de denuncias automáticas.
- No inventar criterios de riesgo, logos, formatos institucionales o permisos no confirmados.

## Cómo empezar con Codex

Coloca estos archivos en la **raíz del repositorio existente**. Si ya hay código, no crees un proyecto nuevo ni sustituyas su arquitectura sin revisar el repositorio.

**Primera instrucción recomendada para Codex:**

> Lee `AGENTS.md`, `PROJECT.md`, `FLUJOS_Y_DATOS.md`, `ADN_VISUAL.md`, `FASES_DE_IMPLEMENTACION.md` y `DECISIONES_PENDIENTES.md`. Primero inspecciona el repositorio e informa: (1) qué funcionalidades están implementadas realmente, (2) qué faltaría respecto del alcance mínimo, (3) riesgos de privacidad y seguridad, y (4) propuesta de siguiente tarea pequeña y verificable. No hagas cambios de código todavía; no presupongas un stack distinto del existente.

**Después del diagnóstico:**

> Implementa únicamente el siguiente incremento acordado de `FASES_DE_IMPLEMENTACION.md`. Respeta `AGENTS.md`, conserva la arquitectura existente cuando sea viable, agrega pruebas de los comportamientos afectados y resume qué quedó listo, qué no y cómo verificarlo.

## Regla de alcance

Las fases técnicas de este paquete **no** son nuevos entregables contractuales. Las decisiones abiertas están marcadas como tales. El objetivo es implementar con orden lo que ya está contemplado en el proyecto, sin añadir módulos ajenos al TDR.
