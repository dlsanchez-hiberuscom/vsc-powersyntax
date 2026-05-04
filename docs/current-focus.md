# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B354 — Server runtime orchestration decomposition`

Estado actual: `B344` queda cerrada. La spec `390-datawindow-binding-edge-cases` fija ya el caso heredado de `plugin_old` para `report -> column -> dddw` sobre el backbone actual y deja el frente DataWindow inmediato sin gaps confirmados de child/report/column occurrences.

La evidencia cerrada que deja `B344` es:

- `src/server/features/dataWindowPropertyPaths.ts` expande ahora el root resoluble de `report(...)` durante completion, de modo que `Modify("rpt_orders.")` publica columnas del child y `DataWindow` en lugar de limitarse a un namespace ciego;
- `test/server/unit/completion.test.ts` y `hover.test.ts` fijan el camino anidado `rpt_orders.status_id.dddw.name` tanto para completion como para hover, sin ampliar el contrato fuera de bindings deterministas;
- `test/fixtures/datawindow-b344/` y `test/smoke/datawindow-b344.extension.test.ts` validan el mismo caso sobre `.srd` reales en disco usando los providers reales del editor;
- `docs/plugin-old-migration-opportunities.md` deja ya ese gap como absorbido y obliga a que cualquier reapertura futura llegue con corpus/fixture nuevo.

---

## 2. Por qué es prioritario

`B354` pasa a ser el siguiente foco natural porque:

- `server.ts` sigue concentrando scheduler, readiness, memory pressure, serving cache, persistence y journals en el mismo host LSP, y ese monolito ya es el siguiente cuello arquitectónico visible;
- `B342` y `B344` despejaron los frentes inmediatos heredados de `plugin_old`, así que el siguiente riesgo real ya no es semántico DataWindow sino orquestación runtime y mantenibilidad del host;
- el backlog marca `B354` como alta prioridad y su trazabilidad con `B347` afecta directamente a la base operativa que soporta el resto de slices.

---

## 3. Trabajo permitido ahora

- separar wiring LSP de políticas runtime sin cambiar contratos de scheduler, readiness, backpressure, memory pressure, serving cache o persistence;
- mover orquestación a slices legibles y testeables manteniendo payloads y observabilidad estables;
- reforzar tests de runtime/health/status y gates de rendimiento sin abrir build/legacy en hot path interactivo.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B344` salvo regresión real en `dataWindowPropertyPaths` o en los fixtures/smoke ya cerrados;
- cambiar políticas de scheduler/backpressure/memory como efecto colateral de una mera extracción estructural;
- mezclar comandos build/legacy dentro del hot path semántico del servidor;
- desplazar el trabajo a nuevas features semánticas mientras el host runtime siga concentrando la orquestación crítica.

---

## 5. Criterios de salida del foco actual

- `server.ts` deja de concentrar la orquestación principal en un único bloque difícil de mantener;
- scheduler/backpressure/memory/readiness conservan contratos, payloads y guards de rendimiento;
- `architecture`, `performance-budget`, `testing`, `backlog`, `done-log` y `current-focus` quedan alineados con el estado real del corte.

---

## 6. Siguiente foco natural

1. `B354` — Server runtime orchestration decomposition.
2. `B292` — PowerBuilder preprocessor / conditional patterns investigation.
3. `B301` — Agent context budget enforcement.

---

## 7. Regla final

`B354` sólo puede descomponer el host runtime si conserva intactas las policies y evita abrir un segundo centro de decisión para scheduling, readiness o memory pressure.
