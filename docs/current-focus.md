# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B264 — Semantic consistency oracle across all read-only surfaces`

Estado actual: `B198`, `B195`, `B251`, `B252`, `B253`, `B254`, `B255`, `B256`, `B257`, `B258`, `B259`, `B260`, `B261`, `B262`, `B263` y `B318` quedan ya cerradas con trazas canónicas en `specs/294-build-orca-documentation-troubleshooting`, `specs/295-orca-packaging-policy-feature-flag`, `specs/296-semantic-snapshot-diff-workspace-states`, `specs/297-powerbuilder-dependency-graph-visual-exportable`, `specs/298-datawindow-sql-lineage-read-only`, `specs/299-datawindow-expression-diagnostics-safe-completion`, `specs/300-cross-project-symbol-conflict-analyzer`, `specs/301-workspace-migration-assistant`, `specs/302-build-profile-matrix-environment-validation`, `specs/303-offline-support-bundle-support-diagnostics-export`, `specs/304-semantic-cache-compaction-retention-policy-v2`, `specs/305-advanced-powerbuilder-code-metrics`, `specs/306-technical-debt-and-modernization-report`, `specs/307-safe-code-action-framework-v2`, `specs/308-agent-ready-task-execution-contracts` y `specs/318-powerbuilder-language-knowledge-catalog-v2`, además de `docs/done-log.md`. El carril build/legacy, la capa read-only/exportable, el soporte offline, la persistencia v2, el reporting técnico, las code actions seguras, los contratos agent-ready y el catálogo de lenguaje v2 ya quedan estabilizados; el bloque pedido por el usuario continúa ahora en `B264`.

Trazas paralelas activas que no desplazan ese foco principal:

- mantenimiento verde del bloque `B241-B250`, únicamente si aparece una regresión real;
- no abrir otro slice de automatización avanzada mientras `B264` siga resoluble dentro del orden pedido.

---

## 2. Por qué es prioritario

Este foco es prioritario porque el repo ya expone múltiples surfaces read-only y necesita demostrar que todas cuentan la misma historia:

- `B260-B263` ya dejaron métricas, deuda técnica, contratos de tarea y explainability suficientes para detectar drift entre surfaces si aparece;
- el riesgo siguiente no es abrir más producto, sino probar consistencia entre `currentObjectContext`, manifest, dependency graph, reports, diagnostics y provenance;
- el siguiente paso útil es un oracle con reason codes que detecte divergencias sin inventar otro motor semántico.

---

## 3. Trabajo permitido ahora

- construir el oracle de consistencia sobre surfaces read-only ya publicadas;
- validar cruces de `objectName`, `objectKind`, `project`, `library`, `sourceOrigin`, ancestor chain, diagnostics, readiness y confidence;
- preservar verde el carril build/legacy/read-only/agent-ready ya cerrado en `B258-B263`.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- reabrir `B263` sin divergencia demostrable del `taskExecutionCatalog` o del tool `contract`;
- mezclar el oracle con nuevas writes, nuevas UIs pesadas o scoring opaco;
- adelantar `B265+` mientras `B264` siga resoluble dentro del orden pedido.

---

## 5. Criterios de salida del foco actual

- `B264` queda cerrada con un oracle defendible y reason codes cruzados sobre las surfaces read-only;
- el siguiente foco natural pasa a `B265`;
- `B263` se mantiene como capa contractual de automatización segura, no como sustituto de la consistencia semántica real.

---

## 6. Siguiente foco natural

1. `B265` — Incremental invalidation proof suite.
2. mantenimiento verde del bloque `B241-B250` y del carril build/legacy/read-only ya cerrado.

---

## 7. Regla final

`B264` debe reutilizar la base pública/read-only, el soporte offline de `B258`, la persistencia v2 de `B259`, las métricas avanzadas de `B260`, el informe de deuda técnica de `B261`, el framework seguro de `B262`, los contratos agent-ready de `B263`, la explainability existente, el asistente de migración de `B256` y la matriz de build de `B257`; no debe abrir un segundo motor semántico ni degradar el hot path por añadir un oracle de consistencia.