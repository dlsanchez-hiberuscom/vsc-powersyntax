# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B381 — AI task context bundle orchestration tool`

Estado actual: `B380` queda cerrada. El repositorio ya dispone de una surface read-only compacta para explicar símbolos del catálogo sin cargar datasets enteros: `explain-system-symbol` existe como tool/API/comando contractual y reutiliza `SystemCatalog` + localization server-side con degradación honesta y fallback localizado.

La evidencia vigente que deja `B380` es:

- `src/shared/publicApi.ts` publica `ApiExplainSystemSymbolRequest`, `ApiExplainSystemSymbolReport`, el tool `explain-system-symbol`, el método `explainSystemSymbol()` y la versión `2.17.0` del contrato público;
- `src/server/features/explainSystemSymbol.ts` concentra el lookup read-only sobre `SystemCatalog`, colapsa duplicados manual/generated por familia semántica, resuelve `resolved|ambiguous|unresolved` y aplica fallback `es -> en` mediante localization ya publicada;
- `src/server/handlers/reportCommandHandlers.ts`, `src/server/handlers/lifecycleHandlers.ts`, `src/client/extension.ts`, `src/client/commandRegistration.ts` y `package.json` cablean el comando `powerbuilder.explainSystemSymbol`, el bridge read-only y la UX `PowerSyntax: Explain System Symbol at Cursor` sin mover el catálogo al cliente ni abrir un serving paralelo;
- `test/server/unit/explainSystemSymbol.test.ts`, `test/server/unit/publicApi.test.ts` y la smoke focal de `test/smoke/extension.test.ts` fijan contrato, fallback por cursor/locale y wiring real del tool/comando.

Con `workspace-check`, `object-check`, `explain-diagnostic` y `explain-system-symbol` ya cerrados, el siguiente cuello de botella pasa a ser orquestar esas surfaces en un bundle compacto y estable para tareas IA reales.

---

## 2. Por qué es prioritario

`B381` es el siguiente paso natural porque ya existen piezas compactas, pero todavía no existe un empaquetado controlado para tareas IA completas:

- `B381` depende de `B376`, `B377`, `B379` y `B380`, y esas cuatro surfaces ya están cerradas y validadas;
- hoy una IA todavía tiene que orquestar varias llamadas por separado para preparar una tarea local de cambio, revisión o troubleshooting;
- un bundle compacto permite fijar límites de tokens, orden de prioridad, trazabilidad y fallback sin reabrir el catálogo ni duplicar lógica de serving.

---

## 3. Trabajo permitido ahora

- añadir el tool read-only `ai-task-context-bundle` y su método público `getAiTaskContextBundle()` o equivalente contractual que termine definiendo la spec activa;
- reutilizar únicamente surfaces ya cerradas (`workspace-check`, `object-check`, `explain-diagnostic`, `explain-system-symbol`, `dependency-graph`, `safe-edit-plan`, `current-object-context`) con límites explícitos de budget y prioridad;
- mantener el bundle en modo read-only, serializable y compacto, sin scans globales implícitos ni recomposición semántica fuera del runtime existente.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B380` salvo drift real del contrato `explain-system-symbol`, sus tests o su wiring;
- mover orquestación IA dentro del core semántico o del hot path interactivo;
- duplicar reports existentes en un bundle ad hoc que ignore `taskExecutionCatalog`, budgets o contratos públicos ya cerrados;
- introducir writes, edición implícita o selección automática de targets fuera de surfaces read-only ya defendibles.

---

## 5. Criterios de salida del foco actual

- existe un bundle read-only contractual para tareas IA concretas con límites de tamaño y selección explícita de secciones;
- el bundle reutiliza surfaces ya publicadas en vez de recalcular contexto o cargar datasets completos;
- el resultado distingue claramente disponibilidad, truncado, findings y acciones recomendadas;
- `architecture`, `testing`, `developer-workflows`, `ai-orchestrator`, `backlog`, `done-log`, `current-focus` y el context pack IA quedan alineados con el contrato nuevo.

---

## 6. Siguiente foco natural

1. `B381` — AI task context bundle orchestration tool.
2. `B320` — DataWindow expression/property official catalog.
3. `B327` — DataWindow constants and property path catalog.

---

## 7. Regla final

`B381` debe orquestar, no reinventar. El bundle IA tiene que construirse sobre surfaces compactas ya validadas y budgets explícitos, sin duplicar semántica ni convertir el cliente o el prompt en un mirror del runtime.
