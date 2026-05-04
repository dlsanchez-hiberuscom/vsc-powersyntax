# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B320 — DataWindow expression/property official catalog`

Estado actual: `B381` queda cerrada. El repositorio ya dispone de una surface read-only compacta para preparar tareas IA reales sin concatenar llamadas manualmente: `ai-task-context-bundle` existe como tool/API/comando contractual, reutiliza las surfaces ya cerradas y degrada de forma honesta bajo budget bajo o foco incompleto.

La evidencia vigente que deja `B381` es:

- `src/shared/publicApi.ts` publica `ApiAiTaskContextBundleRequest`, `ApiAiTaskContextBundle`, el tool `ai-task-context-bundle`, el método `getAiTaskContextBundle()` y la versión `2.18.0` del contrato público;
- `src/client/aiTaskContextBundle.ts` concentra el builder puro del bundle con prioridades por `intent`, estimación conservadora de tokens, `omissions` explícitas y degradación a bundle mínimo cuando el budget es extremo;
- `src/client/extension.ts` y `src/client/commandRegistration.ts` cablean el método público, el tool bridge y el comando `powerbuilder.exportAiTaskContextBundle`, componiendo `workspace-check`, `object-check`, `currentObjectContext`, `safeEditPlan`, `dependencyGraph`, `explain-diagnostic` y `explain-system-symbol` sin abrir un motor semántico paralelo;
- `test/server/unit/aiTaskContextBundle.test.ts`, `test/server/unit/publicApi.test.ts` y la smoke focal de `test/smoke/extension.test.ts` fijan intents `bug-fix/refactor/catalog-work`, foco ausente, truncado real y wiring del método/tool/comando.

Con el rail IA compacto ya estabilizado (`workspace-check`, `object-check`, `explain-diagnostic`, `explain-system-symbol`, `ai-task-context-bundle`), el siguiente cuello de botella vuelve a ser de conocimiento DataWindow oficial y no de orquestación.

---

## 2. Por qué es prioritario

`B320` vuelve a ser el siguiente paso natural porque:

- el carril read-only para IA ya puede pedir contexto compacto sin reabrir surfaces cerradas;
- el mayor hueco semántico visible ahora está en catálogo oficial de expresiones/propiedades DataWindow, no en empaquetado contextual;
- `B320` desbloquea mejoras posteriores en hover, completado, diagnostics y explainability sobre un sublenguaje que sigue teniendo cobertura desigual.

---

## 3. Trabajo permitido ahora

- profundizar en el catálogo oficial de expresiones y propiedades DataWindow sin mezclarlo con PowerScript general;
- reforzar parsing/serving/pruebas DataWindow sobre conocimiento oficial y fixtures reales ya existentes;
- reutilizar el rail IA recién cerrado sólo como consumidor del conocimiento nuevo, no como excusa para reabrir B381.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B381` salvo drift real del contrato `ai-task-context-bundle`, sus tests o su wiring;
- volver a mover orquestación IA dentro del core semántico o del hot path interactivo;
- duplicar catálogo DataWindow en prompts, clientes o bridges paralelos en vez de servirlo desde el runtime existente;
- introducir writes o heurísticas opacas dentro del carril read-only recién estabilizado.

---

## 5. Criterios de salida del foco actual

- el catálogo DataWindow oficial cubre expresiones/propiedades priorizadas con contratos y fixtures defendibles;
- la semántica nueva alimenta surfaces existentes sin abrir un segundo rail DataWindow ad hoc;
- `architecture`, `testing`, `developer-workflows`, `backlog`, `done-log`, `current-focus` y el context pack IA quedan alineados con el nuevo estado real.

---

## 6. Siguiente foco natural

1. `B320` — DataWindow expression/property official catalog.
2. `B327` — DataWindow constants and property path catalog.
3. `B342` — Extract proven symbol heuristics from plugin_old.

---

## 7. Regla final

`B320` debe ampliar conocimiento oficial DataWindow sin volver a abrir el problema de empaquetado IA ya resuelto por `B381`.
