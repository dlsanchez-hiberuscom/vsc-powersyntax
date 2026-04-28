# Constitución del proyecto — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Esta constitución define los principios no negociables del repositorio para el desarrollo del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

Su objetivo es asegurar que toda evolución del producto mantenga:

- rapidez de carga,
- arquitectura profesional y mantenible,
- separación estricta de responsabilidades,
- validación continua,
- documentación sincronizada,
- evolución incremental sin romper el core,
- y un uso disciplinado de IA dentro de un flujo **Spec-Driven Development (SDD)**.

Esta constitución gobierna tanto el trabajo manual como el trabajo asistido por IA y debe prevalecer sobre decisiones locales o atajos de implementación cuando exista conflicto.

---

## 2. Principios no negociables

### Artículo I — Rendimiento primero

Toda feature, refactor o mejora debe proteger la **velocidad de carga**, la **reactividad del editor** y el comportamiento correcto en workspaces grandes.

No se aceptarán cambios que introduzcan coste de arranque, bloqueo visible del editor o degradación significativa de latencia sin una justificación clara, una mitigación documentada y una validación razonable.

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

Toda feature o cambio con impacto funcional, arquitectónico u operativo debe derivar de una spec o actualizar una existente.

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
- omitir documentación afectada,
- ni presentar como implementado algo que solo es intención, propuesta o estado parcial.

La IA debe trabajar siempre bajo la constitución, la spec vigente y la documentación canónica del repositorio.

### Artículo XIII — El core del dominio debe ser agnóstico del editor

El modelo interno de PowerBuilder, su semántica y sus casos de uso no deben depender directamente de:

- la API de VS Code,
- el transporte LSP,
- formatos JSON externos,
- DTOs de integración,
- ni herramientas de IA concretas.

Toda integración con editor, protocolo, serialización o automatización debe realizarse mediante adaptadores y contratos de borde.

### Artículo XIV — Fuente única de verdad semántica

La arquitectura debe converger a una base semántica compartida y reutilizable.

Ninguna feature debe reconstruir por su cuenta lógica de símbolos, scopes, resolución, tipos o referencias si ya existe una capa común para ello.

Las capacidades del lenguaje deben apoyarse progresivamente en servicios compartidos, no en implementaciones aisladas por feature.

### Artículo XV — Los contratos no exponen el dominio interno

Los contratos compartidos entre procesos o consumidores externos no deben exponer directamente entidades internas del dominio.

La representación externa debe mantenerse separada del modelo interno para permitir evolución, versionado y sustitución de adaptadores sin romper el core.

### Artículo XVI — Las capas bootstrap deben ser temporales y decrecientes

Las soluciones provisionales son válidas cuando aportan valor temprano, pero deben:

- identificarse explícitamente como bootstrap,
- tener límites claros,
- no absorber responsabilidades permanentes de la arquitectura objetivo,
- y disponer de una dirección de migración razonable.

No se debe consolidar como permanente una capa provisional solo por acumulación histórica.

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

### 4.1 Jerarquía de autoridad documental

En caso de conflicto entre artefactos, el orden de autoridad será:

1. `docs/constitution.md`
2. `docs/architecture.md`
3. specs aprobadas en `specs/`
4. `docs/roadmap.md`
5. `docs/backlog.md`
6. `docs/current-focus.md`
7. implementación actual

La existencia de código funcionando no invalida por sí sola una decisión arquitectónica o documental vigente; si el código diverge, debe documentarse y corregirse.

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
- documentación afectada,
- y, cuando aplique, riesgos y mitigaciones.

Si no puede expresarse de forma clara, todavía no está lista para implementarse.

---

## 6. Definición de Ready

Una feature está **Ready** cuando:

- existe una spec comprensible y acotada,
- el alcance está claro,
- el fuera de alcance está claro,
- los criterios de aceptación son verificables,
- el plan técnico es suficiente,
- los riesgos principales son entendibles,
- y las tareas están troceadas de forma razonable.

---

## 7. Definición de Done

Una feature está **Done** solo cuando:

- cumple sus criterios de aceptación,
- pasa la validación prevista,
- no introduce degradaciones injustificadas,
- la documentación afectada está actualizada,
- el estado real del código coincide con la spec y el backlog/documentación canónica,
- y no deja deuda crítica oculta sin registrar.

---

## 8. Reglas estructurales mínimas

- El cliente no implementa semántica profunda.
- Las features LSP actúan como adaptadores finos y no como núcleo semántico.
- Los adaptadores no definen el dominio.
- Los contratos compartidos no deben arrastrar entidades internas del core.
- Las capas temporales no deben convertirse en arquitectura permanente sin decisión explícita.
- La lógica reutilizable debe migrar hacia servicios comunes y no duplicarse entre features.
- Toda capacidad costosa debe declarar estrategia de invalidación, cancelación y caché cuando aplique.
- Ningún módulo genérico de soporte debe crecer hasta convertirse en contenedor difuso de responsabilidades heterogéneas.

---

## 9. Evidencia mínima para decisiones relevantes

Toda afirmación relevante sobre rendimiento, activación, escalabilidad o calidad debe apoyarse, cuando sea razonablemente posible, en al menos una de estas evidencias:

- prueba automatizada,
- prueba de integración,
- validación manual guiada,
- medición antes/después,
- benchmark simple,
- o razonamiento técnico documentado y revisable.

No basta con asumir que una mejora no degrada comportamiento crítico; debe existir al menos una forma razonable de justificarlo.

---

## 10. Cumplimiento y excepciones

Esta constitución aplica a:

- trabajo manual,
- trabajo asistido por IA,
- prompts para agentes,
- propuestas de arquitectura,
- refactors,
- correcciones,
- pruebas,
- y documentación.

Cualquier excepción debe:

- estar justificada de forma explícita,
- registrarse en la spec o documento técnico correspondiente,
- indicar alcance y duración,
- explicar el riesgo asumido,
- y dejar claro el plan de salida o revisión posterior.

Las excepciones no deben usarse para evitar validación, documentación o revisión de impactos sin dejar rastro documental.

---

## 11. Archivos canónicos actualmente bajo revisión continua

A fecha de esta constitución, los documentos que forman parte del núcleo documental operativo y que deberán revisarse con especial frecuencia son, como mínimo:

- `docs/ai-agents-catalog.md`
- `docs/ai-orchestrator.md`
- `docs/ai-strategy.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/constitution.md`
- `docs/current-focus.md`
- `docs/performance-budget.md`
- `docs/roadmap.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`

Este listado no sustituye la obligación general de revisar cualquier otro artefacto afectado por un cambio.
