# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B379 — Explain diagnostic tool and suggested safe fix contract`

Estado actual: `B378` queda cerrada. El repositorio ya dispone de un context pack corto, versionado y referenciado para tareas IA, de forma que el siguiente cuello de botella pasa a ser explicar diagnostics concretos sin obligar a releer archivos completos ni a reconstruir contexto manualmente.

La evidencia vigente que deja `B378` es:

- `docs/ai-context/powerbuilder-plugin-context.md` existe ya como entrada corta para agentes: recoge misión, boundaries, reglas PowerBuilder/SQL/DataWindow, validación, do-not-do, foco activo y ownership documental sin duplicar documentos largos ni datasets `generated/manual/localization` completos;
- `docs/ai-strategy.md`, `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/developer-workflows.md`, `docs/spec-driven-development.md` y `AGENTS.md` referencian ya ese pack como atajo operativo, dejando claro que la autoridad sigue viviendo en la documentación propietaria;
- `test/server/unit/aiContextDocs.test.ts` fija el guard documental mínimo: el pack no puede desaparecer, perder headings mínimos, crecer sin control o quedar huérfano respecto a la documentación canónica;
- `specs/383-ai-context-pack-contract/` deja la traza SDD mínima para el backlog `B378` sin reutilizar numeración histórica de `specs/378-*`.

Con el pack base de contexto ya cerrado, el siguiente cuello de botella pasa a ser explicativo: toca abrir `B379` para exponer un tool/API read-only que resuma un diagnostic concreto con evidencia mínima, reason code, scope y posible fix seguro cuando exista.

---

## 2. Por qué es prioritario

Con `B378` cerrada, ya existe una entrada corta para prompts. Ahora falta reducir el coste de entender problemas concretos:

- `B379` debe permitir que una IA explique un diagnostic usando `diagnostic.code`, posición, evidencia y contexto opcional sin releer archivos enteros;
- el repositorio ya tiene diagnostics estables, explainability panel y `object-check`, pero aún falta una surface read-only específica y compacta para troubleshooting guiado;
- `B381` depende de este contrato explicativo, así que dejarlo abierto bloquea el bundle de contexto IA más útil.

---

## 3. Trabajo permitido ahora

- añadir el tool read-only `explain-diagnostic`, su comando `powerbuilder.explainDiagnostic` y el método público `explainDiagnostic()`;
- reutilizar diagnostics existentes, `currentObjectContext` y `safeEditPlan` cuando haga falta contexto adicional o fix seguro sugerido;
- mantener todo el flujo en modo explicativo/read-only, sin writes y sin abrir un segundo motor de diagnostics.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B378` salvo drift real del context pack o de su guard documental;
- aplicar fixes automáticamente o modificar archivos desde `B379`;
- abrir un segundo carril de diagnostics o parsear el workspace entero cuando el diagnostic concreto ya aporta ancla suficiente;
- inventar remediaciones no respaldadas por `safeEditPlan`, `diagnostic.code` o evidencia real del runtime.

---

## 5. Criterios de salida del foco actual

- existe `explain-diagnostic` como tool/API/comando read-only contractual;
- el report devuelve el diagnostic objetivo con `code`, severidad, posición, explicación compacta, `reasonCode` y evidencia mínima suficiente;
- cuando aplique, el report puede sumar contexto del objeto actual y un safe fix sugerido sin editar archivos;
- `testing`, `architecture`, `developer-workflows`, `backlog`, `done-log` y `current-focus` quedan alineados con el contrato nuevo.

---

## 6. Siguiente foco natural

1. `B380` — Explain system symbol and catalog lookup tool for AI.
2. `B381` — AI task context bundle orchestration tool.
3. `B320` — DataWindow expression/property official catalog.

---

## 7. Regla final

`B379` debe construir sobre diagnostics ya publicados y contratos read-only existentes. No toca arreglar errores por su cuenta: toca explicar mejor, con menos tokens y con evidencia más precisa, lo que el runtime ya sabe.
