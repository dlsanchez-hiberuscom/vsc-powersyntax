# Constitución del proyecto — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Esta constitución define los principios no negociables del repositorio para el desarrollo del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

Su objetivo es asegurar que toda evolución del producto mantenga:

- rapidez de carga,
- arquitectura profesional y mantenible,
- separación estricta de responsabilidades,
- validación continua,
- documentación sincronizada,
- y un uso disciplinado de IA dentro de un flujo **Spec-Driven Development (SDD)**.

---

## 2. Principios no negociables

### Artículo I — Rendimiento primero

Toda feature, refactor o mejora debe proteger la **velocidad de carga**, la **reactividad del editor** y el comportamiento correcto en workspaces grandes.

No se aceptarán cambios que introduzcan coste de arranque, bloqueo visible del editor o degradación significativa de latencia sin una justificación clara y una mitigación documentada.

### Artículo II — Cliente ligero, servidor LSP para trabajo pesado

El **cliente de VS Code** debe ser lo más fino posible.

Toda lógica pesada de análisis, indexación, semántica, resolución de símbolos, diagnósticos o procesamiento intensivo debe residir en el **servidor LSP** o en servicios internos equivalentes fuera del camino crítico del Extension Host.

### Artículo III — Activación perezosa obligatoria

La extensión debe activarse únicamente cuando exista una necesidad real.

Se prohíbe introducir activaciones globales innecesarias o procesos pesados al inicio de VS Code salvo justificación excepcional, documentada y validada.

### Artículo IV — Declarativo antes que programático

Toda capacidad que pueda implementarse de forma declarativa deberá priorizarse antes de introducir lógica programática adicional.

Esto incluye, cuando aplique:

- registro de lenguajes,
- gramáticas,
- snippets,
- configuraciones del lenguaje,
- defaults de editor,
- y metadatos del manifiesto.

### Artículo V — El archivo abierto tiene prioridad

La experiencia del usuario en el **archivo activo** tiene prioridad sobre el trabajo global del workspace.

Toda estrategia de análisis debe seguir este orden preferente:

1. archivo abierto,
2. dependencias inmediatas,
3. contexto relevante cercano,
4. indexación global en segundo plano.

### Artículo VI — Análisis incremental y cancelable

El sistema debe diseñarse para trabajo incremental.

No se debe reanalizar el workspace completo por cambios pequeños cuando exista una alternativa de invalidación fina.

Toda tarea costosa debe ser cancelable, diferible o desacoplable del flujo interactivo cuando sea posible.

### Artículo VII — La documentación es parte del cambio

Ningún cambio relevante se considera terminado si la documentación afectada no está actualizada.

Como mínimo, deben revisarse y actualizarse cuando aplique:

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- specs afectadas en `specs/`

### Artículo VIII — La spec manda

Este repositorio sigue un enfoque **Spec-Driven Development**.

Toda feature o cambio con impacto funcional, arquitectónico o operativo debe derivar de una spec o actualizar una existente.

Si durante la implementación cambia la intención, primero debe corregirse la spec y después el código.

### Artículo IX — Slices pequeños y revisables

Toda evolución debe dividirse en slices pequeños, valiosos y verificables.

Se prohíben macro-cambios opacos difíciles de revisar o validar.

Si una feature no puede entenderse y revisarse con atención humana en poco tiempo, debe dividirse.

### Artículo X — Validación obligatoria

Toda feature debe definir una estrategia mínima de validación.

Según el tipo de cambio, esto puede incluir:

- pruebas unitarias,
- pruebas de integración,
- validación manual guiada,
- pruebas sobre workspaces reales,
- checks de rendimiento,
- verificación de activación y carga,
- y comprobación de documentación actualizada.

### Artículo XI — Nada se cierra en parcial

Una tarea o feature no se considera cerrada si falta cualquiera de estos elementos:

- implementación funcional,
- validación suficiente,
- documentación alineada,
- cumplimiento de criterios de aceptación,
- y reflejo correcto del estado en backlog / current-focus / roadmap si aplica.

### Artículo XII — La IA no puede inventar alcance

La IA puede ayudar a especificar, planificar, implementar, probar y documentar, pero no debe:

- inventar features no pedidas,
- reabrir arquitectura cerrada sin causa,
- cerrar trabajo sin validación,
- ni omitir documentación afectada.

La IA debe trabajar siempre bajo la constitución, la spec vigente y la documentación canónica del repositorio.

---

## 3. Reglas de decisión arquitectónica

Cuando existan varias alternativas, se priorizará la opción que mejor cumpla este orden:

1. menor impacto en carga y arranque,
2. menor coste para el Extension Host,
3. mayor separación de responsabilidades,
4. mejor capacidad de prueba,
5. mayor facilidad de mantenimiento,
6. mejor escalabilidad en workspaces grandes,
7. mejor compatibilidad con automatización e IA.

Si una opción técnicamente elegante empeora claramente el arranque, la simplicidad operativa o la mantenibilidad, debe descartarse salvo justificación fuerte.

---

## 4. Política de documentación viva

Toda decisión relevante debe quedar capturada en un artefacto mantenible del repositorio.

Las decisiones temporales o exploratorias deben acabar en uno de estos estados:

- adoptadas y documentadas,
- descartadas y registradas,
- o abiertas con siguiente paso claro.

No deben existir decisiones importantes solo en mensajes sueltos o contexto oral.

---

## 5. Política de calidad para nuevas features

Toda nueva feature debe incluir explícitamente:

- objetivo,
- alcance,
- fuera de alcance,
- criterios de aceptación,
- impacto en arquitectura,
- impacto en rendimiento,
- estrategia de validación,
- y documentación afectada.

Si no puede expresarse de forma clara, todavía no está lista para implementarse.

---

## 6. Definición de Ready

Una feature está **Ready** cuando:

- existe una spec comprensible y acotada,
- el alcance está claro,
- el fuera de alcance está claro,
- los criterios de aceptación son verificables,
- el plan técnico es suficiente,
- y las tareas están troceadas de forma razonable.

---

## 7. Definición de Done

Una feature está **Done** solo cuando:

- cumple sus criterios de aceptación,
- pasa la validación prevista,
- no introduce degradaciones injustificadas,
- la documentación afectada está actualizada,
- y el estado real del código coincide con la spec y el backlog/documentación canónica.

---

## 8. Cumplimiento

Esta constitución aplica a:

- trabajo manual,
- trabajo asistido por IA,
- prompts para agentes,
- propuestas de arquitectura,
- refactors,
- correcciones,
- pruebas,
- y documentación.

Cualquier excepción debe quedar justificada de forma explícita en la spec o en la documentación técnica correspondiente.
