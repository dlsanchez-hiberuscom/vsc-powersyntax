# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B299 — Agent execution dry-run contract`

Estado actual: `B301` queda cerrada. La spec `393-agent-context-budget-enforcement` fija que `ai-task-context-bundle` ya expone budgets visibles con `reasonCodes` y receipt de paginación, y que payloads grandes degradan dentro del budget sin reabrir contexto masivo.

La evidencia cerrada que deja `B301` es:

- `ApiAiTaskContextBundle` publica `reasonCodes` machine-readable y `pagination` receipts para `diagnosticExplanations` y `systemSymbolExplanations`;
- `buildAiTaskContextBundle()` mantiene budgets por `intent` y reason codes explícitos para límites de lista, pruning por budget, minimización de meta y bundle mínimo;
- `test/server/unit/aiTaskContextBundle.test.ts` fija budgets bajos, truncado por límites de lista y caps sobre un `workspaceCheck` inflado;
- `test/server/unit/publicApi.test.ts` mantiene verde el contrato público/read-only bridge tras ampliar el payload de forma aditiva.

---

## 2. Por qué es prioritario

`B299` pasa a ser el siguiente foco natural porque:

- `B301` ya cerró los budgets, reason codes y caps sobre payloads grandes, así que el siguiente bloqueo real del carril write-enabled es exigir dry-run antes de cualquier ejecución;
- `B299` abre el contrato declarativo previo a `B300`, `B302` y `B303`, que dependen de tener plan/impacto validable antes de tocar código o emitir receipts finales;
- el backlog lo coloca ahora al frente del carril de AI automation safety y su resultado condiciona cualquier write-enabled posterior.

---

## 3. Trabajo permitido ahora

- definir un contrato dry-run declarativo para tareas agent-ready write-enabled;
- exigir plan, impacto, archivos afectados, tests, docs y bloqueos antes de cualquier ejecución real;
- validar el schema y el tool bridge sin introducir writes ni side effects.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B301` salvo regresión demostrable en budgets, caps de payload o reason codes visibles;
- ejecutar writes reales o receipts finales sin haber cerrado antes el contracto dry-run de `B299`;
- meter side effects o heurísticas locales no trazables dentro del rail dry-run;
- mezclar el rail de dry-run con cambios semánticos o de runtime ajenos al carril de agentes.

---

## 5. Criterios de salida del foco actual

- el contrato dry-run expone plan, impacto, archivos, tests, docs y bloqueos antes de cualquier write-enabled;
- el public contract y el tool bridge validan el schema sin ejecutar cambios reales;
- `docs/spec-driven-development.md`, `docs/ai-orchestrator.md`, `docs/backlog.md`, `docs/done-log.md` y `docs/current-focus.md` quedan alineados con el resultado.

---

## 6. Siguiente foco natural

1. `B299` — Agent execution dry-run contract.
2. `B300` — Agent validation receipt.
3. `B302` — Agent-safe documentation updater policy.

---

## 7. Regla final

`B299` sólo puede abrir el carril write-enabled si deja un dry-run declarativo y verificable como gate contractual antes de cualquier ejecución real.
