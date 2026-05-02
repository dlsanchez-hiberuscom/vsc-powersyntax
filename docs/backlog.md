# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por orden de prioridad global.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- Crear sub-specs solo cuando vaya a implementarse el ítem.
- No cerrar si falta código real, tests/validación suficiente, documentación alineada y actualización de roadmap/current-focus si aplica.
- Si un ítem crece demasiado, dividir en sub-specs, no duplicar ítems padre.
- Registrar deuda nueva en **Backlog derivado**.
- Tratar `plugin_old` como guía, dataset y referencia de patrones probados, no como código a portar por inercia.
- Las dependencias hacia ítems `Done` se consideran ya satisfechas y quedan solo como trazabilidad histórica.
- No sacrificar la meta maestra por features secundarias.

---

## 2. Estados oficiales

- **Open:** sin slice activa de cierre.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Ready for closure:** código y tests básicos existen; falta revisión final, documentación o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

---

## 3. Orden maestro de prioridad

### L0 — Core platform no negociable

Estado: cerrado como bloque operativo. Los ítems cerrados viven en `done-log.md`.

### L1 — Persistencia y modelo de workspace/proyecto

Base cerrada como bloque operativo; reabrir solo para gaps incrementales de routing, provenance o modelo de proyecto.

### L2 — Query engine y serving profesional

Base materializada; este carril queda para refuerzos puntuales de serving, latencia y consultas compartidas.

### L2.5 — PowerBuilder semantic understanding

Base materializada para sourceOrigin, metadata enriquecida, eventos, invocaciones, lifecycle, transacciones y dependencias nativas; reabrir solo para gaps semánticos concretos.

### L3 — Validación fuerte, salud interna y excelencia operativa

Validación real, corpus, health, performance y calidad operativa.

### L4 — Especialización PowerBuilder y automatización

DataWindow, PBAutoBuild, ORCA/PBL y especialización del ecosistema.

### L4.5 — AI-ready PowerBuilder context

Contexto semántico read-only para IA antes de automatización write-enabled.

### L5 — Documentación IA-first y workflows

Gobierno documental, workflows de usuario y reglas diagnósticas.

---

## 4. Ítems cerrados fuera del backlog activo

Los siguientes ítems ya no deben aparecer como trabajo activo:

```text
B031, B032, B063, B065, B066, B071B, B109, B122, B123, B124, B125, B126,
B134, B141, B141A, B151, B151A, B152, B152A, B153, B154, B155,
B156, B158, B159, B163, B164, B165, B166, B169, B169A, B170,
B172, B173, B174, B176, B204, B206, B207, B208, B209, B210, B211, B213,
B067, B175, B188, B214, B215, B216, B223, B224, B230, B231, B232, B233
```

El detalle técnico de cierre vive en `done-log.md`, que es la autoridad exhaustiva de trabajo cerrado. Esta lista es una ayuda operativa y no debe usarse para reabrir o cerrar trabajo por sí sola.

---

# 5. Backlog activo

# L1 — Persistencia y modelo de workspace/proyecto

Sin ítems activos inmediatos en L1 tras cerrar `B224`; reabrir solo si aparece otro gap incremental de routing o provenance.

---

# L2 — Query engine y serving profesional

Sin refuerzos activos inmediatos en L2 tras cerrar `B067` y `B223`; reabrir solo para gaps nuevos de serving interactivo o productividad ya trazables.

---

# L2.5 — PowerBuilder semantic understanding

Tras cerrar `B204`, `B206`, `B207`, `B208`, `B209`, `B210`, `B211` y `B213`, L2.5 reabre solo para gaps semánticos concretos detectados en corpus reales.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

Sin ítems abiertos inmediatos en L3; `B226` y `B229` ya quedaron registrados en `docs/done-log.md` y L3 solo debe reabrirse ante gaps nuevos de validación, corpus o salud interna todavía no trazados.

# L4 — Especialización PowerBuilder y automatización

Este tramo ya movió a `docs/done-log.md` los cierres recientes (`B081`, `B182`, `B186`, `B189-B191`, `B193-B194`, `B196-B197`, `B199-B200`). El backlog activo de L4 conserva solo trabajo todavía abierto o pendiente de ancla canónica real.

## B195 — ORCA executable/PBD operations behind feature flag
- **Estado:** Open
- **Track:** legacy ecosystem / packaging
- **Depende de:** B194
- **Desbloquea:** B198
- **Objetivo:** evaluar si exponer creación de ejecutables/PBD/DLL vía ORCA.
- **Cierre:** decisión documentada sin contaminar ruta PBAutoBuild.

## B198 — Build/ORCA documentation and troubleshooting
- **Estado:** Open
- **Track:** docs / operability
- **Depende de:** B186, B187, B194, B197
- **Objetivo:** documentar flujo moderno PBAutoBuild y legacy ORCA.
- **Cierre:** README/docs explican cuándo usar PBAutoBuild, cuándo ORCA y riesgos.

---

# L4.5 — AI-ready PowerBuilder context

Bloque `B241`, `B242`, `B243` y `B249` ya cerrado, validado y movido a `docs/done-log.md`, con trazas canónicas en `specs/284-public-api-v2-contract-hardening`, `specs/285-json-rpc-local-tool-bridge-read-only`, `specs/286-workspace-semantic-export-import-snapshot` y `specs/292-safe-batch-refactor-plan`.

---

# L5 — Documentación IA-first y workflows

Bloque `B244`, `B245` y `B250` ya cerrado, validado y movido a `docs/done-log.md`, con trazas canónicas en `specs/287-extension-settings-governance-profiles`, `specs/288-diagnostics-explainability-panel` y `specs/293-release-marketplace-readiness`.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

Bloque `B246` y `B247` ya cerrado, validado y movido a `docs/done-log.md`, con trazas canónicas en `specs/289-performance-budget-gate-ci` y `specs/290-large-workspace-incremental-stress`.

---

# L2.5 — PowerBuilder semantic understanding

`B248` ya queda cerrado, validado y movido a `docs/done-log.md`, con traza canónica en `specs/291-powerbuilder-framework-knowledge-packs`.

---

# 6. Current execution focus

## Fase activa — Deuda residual post-B241-B250

**Orden inmediato:**

1. B198 — build/ORCA documentation and troubleshooting.
2. B195 — packaging legacy solo si `B198` deja despejada la deuda operativa.

## Siguiente bloque técnico recomendado

Con `B081`, `B182`, `B186`, `B188-B194`, `B196-B197`, `B199-B200`, `B226`, `B229` y el bloque `B241-B250` ya cerrados y movidos a `docs/done-log.md`, el siguiente bloque técnico recomendado debe ejecutarse en este orden:

1. `B198` — consolidar troubleshooting y guía de uso del carril legacy sobre el estado ya materializado.
2. `B195` — evaluar packaging legacy solo cuando el carril operativo/documental ya no tenga deuda más urgente.

## Persistencia robusta pendiente

Sin línea de persistencia robusta prioritaria abierta tras el cierre de `B155`, `B167`, `B168` y `B071`.

## Validación temprana permitida

Sin nueva línea de validación temprana prioritaria abierta tras el cierre de `B081`; el siguiente frente de validación útil queda subordinado a la normalización del siguiente bloque canónico y al mantenimiento verde del bridge DataWindow recién cerrado.

---

# 7. Backlog derivado

- Decisión tomada: con `B081`, `B186`, `B188-B194`, `B196-B197` y `B199-B200` ya cerradas, el carril moderno de PBAutoBuild queda funcional end-to-end y el carril ORCA/PBL ya tiene base, capability, graph read-only, export controlado, prioridad de provenance estable, rail write-enabled completo, gating de sync frente a source real obsoleto, journal técnico persistente de `build|legacy`, workflow spec-driven unitario y orquestación bulk secuencial sobre PBL; la deuda restante del ecosistema build/legacy se concentra en `B195` y `B198`.
- El bloque `B241-B250` queda ya cerrado, validado y movido a `docs/done-log.md` con trazas en `specs/284-293`; cualquier reapertura futura exige regresión demostrable o cambio explícito de alcance.
- Decidir si el bloque ORCA debe agruparse bajo una épica padre explícita o mantenerse como secuencia `B191-B198`.
- Definir matriz de soporte: PowerBuilder 2025 workspace/solution, target `.pbt`, PBL-only legacy y source plain-text.
