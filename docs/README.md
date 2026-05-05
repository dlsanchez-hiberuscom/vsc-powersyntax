# Docs README — PowerBuilder VS Code Plugin

## 1. Propósito

Este índice define cómo se navega la documentación canónica del repositorio.

Su función es evitar búsquedas ad hoc, reforzar el ownership por área y dejar claro qué documento contiene cada decisión.

---

## 2. Orden de lectura recomendado

Ruta corta para cambios relevantes:

1. `docs/constitution.md`
2. `docs/current-focus.md`
3. `docs/backlog.md`
4. spec activa en `specs/`
5. `docs/architecture.md`
6. `docs/architecture-status.md`
7. documento propietario del área tocada
8. `docs/testing.md`
9. `docs/performance-budget.md` cuando el cambio toca runtime, hot path o budgets

---

## 3. Autoridad documental

En caso de conflicto, manda este orden:

1. `docs/constitution.md`
2. `docs/architecture.md`
3. specs aprobadas en `specs/`
4. `docs/architecture-status.md`
5. `docs/current-focus.md`
6. `docs/backlog.md`
7. `docs/roadmap.md`
8. `docs/done-log.md`
9. implementación actual

`docs/current-focus.md` y `docs/backlog.md` gobiernan el trabajo vivo.

`docs/done-log.md` es histórico cerrado y no debe usarse como foco operativo.

---

## 4. Mapa de documentos propietarios

| Área | Documento propietario |
| --- | --- |
| Reglas no negociables | `docs/constitution.md` |
| Arquitectura estable | `docs/architecture.md` |
| Estado implementado | `docs/architecture-status.md` |
| Trabajo pendiente vivo | `docs/backlog.md` |
| Foco activo o reposo | `docs/current-focus.md` |
| Dirección estratégica | `docs/roadmap.md` |
| Histórico cerrado | `docs/done-log.md` |
| Modelo operativo | `docs/product-operating-model.md` |
| Gobernanza documental | `docs/documentation-governance.md` |
| Flujo SDD | `docs/spec-driven-development.md` |
| Validación | `docs/testing.md` |
| Presupuesto de rendimiento | `docs/performance-budget.md` |
| Workflows de usuario | `docs/developer-workflows.md` |
| IA y agentes | `docs/ai/README.md`, `AGENTS.md` |
| Catálogo y localización documental | `docs/catalog/system-catalog-architecture.md`, `docs/catalog/catalog-localization-workflow.md` |
| Build, VSIX y release | `docs/build/README.md`, `docs/release/release-process.md`, `docs/release/ci-cd-architecture.md` |
| Core semántico | `docs/core/semantic-core-architecture.md`, `docs/core/query-engine-architecture.md`, `docs/core/source-origin-readiness-confidence.md` |
| DataWindow | `docs/datawindow/datawindow-architecture.md` |
| SQL y runtime PowerBuilder | `docs/sql/sql-runtime-architecture.md` |
| Observabilidad runtime | `docs/runtime/runtime-observability.md` |
| Reglas diagnósticas | `docs/rules/rules-catalog.md` |
| Plantillas | `docs/templates/*` |
| Prompts operativos | `docs/prompts/*` |

---

## 5. Índice por carpeta

### Raíz de `docs/`

- Reglas y arquitectura: `constitution.md`, `architecture.md`, `architecture-status.md`
- Operación: `product-operating-model.md`, `documentation-governance.md`, `spec-driven-development.md`
- Estado vivo: `backlog.md`, `current-focus.md`, `roadmap.md`, `done-log.md`
- Validación y soporte: `testing.md`, `performance-budget.md`, `developer-workflows.md`, `troubleshooting.md`, `support.md`, `contributing.md`

### Subdirectorios propietarios

- `docs/ai/`: contratos de IA, agentes y context bundles
- `docs/catalog/`: source of truth, overlays y localización documental del catálogo
- `docs/build/`: carriles build/VSIX/ORCA/PBAutoBuild
- `docs/release/`: proceso de release y CI/CD
- `docs/core/`: core semántico, query engine y contratos transversales
- `docs/datawindow/`: fronteras y modelo DataWindow
- `docs/sql/`: SQL embebido, runtime y degradación segura
- `docs/runtime/`: observabilidad, readiness, health y budgets visibles
- `docs/rules/`: catálogo de diagnósticos y reason codes
- `docs/templates/`: plantillas canónicas
- `docs/prompts/`: prompts operativos para auditoría y ejecución guiada

---

## 6. Reglas de edición

- Modificar primero el documento propietario del área.
- Sustituir duplicidad larga por resumen corto y enlace.
- Actualizar `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` cuando cambie el estado real.
- Ejecutar `npm run test:docs:drift` en toda reorganización documental relevante.

---

## 7. Estado actual del árbol documental

- El repositorio está en reposo operativo: no hay una nueva cadena promovida en `docs/current-focus.md`.
- `docs/roadmap.md` conserva solo dirección estratégica y reglas de promoción.
- El detalle histórico vive exclusivamente en `docs/done-log.md`.