# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B281 — Override and overload resolution hardening`

Estado actual: `B198`, `B195`, `B251`, `B252`, `B253`, `B254`, `B255`, `B256`, `B257`, `B258`, `B259`, `B260`, `B261`, `B262`, `B263`, `B264`, `B265`, `B266`, `B267`, `B268`, `B269`, `B270`, `B271`, `B272`, `B273`, `B274`, `B275`, `B276`, `B277`, `B278`, `B279` y `B280` quedan ya cerradas con trazas canónicas en `specs/294-build-orca-documentation-troubleshooting`, `specs/295-orca-packaging-policy-feature-flag`, `specs/296-semantic-snapshot-diff-workspace-states`, `specs/297-powerbuilder-dependency-graph-visual-exportable`, `specs/298-datawindow-sql-lineage-read-only`, `specs/299-datawindow-expression-diagnostics-safe-completion`, `specs/300-cross-project-symbol-conflict-analyzer`, `specs/301-workspace-migration-assistant`, `specs/302-build-profile-matrix-environment-validation`, `specs/303-offline-support-bundle-support-diagnostics-export`, `specs/304-semantic-cache-compaction-retention-policy-v2`, `specs/305-advanced-powerbuilder-code-metrics`, `specs/306-technical-debt-and-modernization-report`, `specs/307-safe-code-action-framework-v2`, `specs/308-agent-ready-task-execution-contracts`, `specs/309-semantic-consistency-oracle`, `specs/310-incremental-invalidation-proof-suite`, `specs/311-query-scope-policy-v2`, `specs/312-runtime-backpressure-policy-v2`, `specs/313-core-module-dependency-firewall`, `specs/314-cross-surface-golden-contract-matrix`, `specs/315-workspace-partition-isolation-multi-root-stress-hardening`, `specs/316-memory-pressure-adaptive-degradation`, `specs/317-long-running-session-stability-soak-tests`, `specs/318-hot-path-allocation-budget-and-regression-guard`, `specs/319-persistent-cache-corruption-fuzz-recovery-suite`, `specs/320-semantic-snapshot-schema-evolution-compatibility`, `specs/321-telemetry-free-observability-contract`, `specs/322-powerbuilder-parser-resilience-fuzzing`, `specs/323-core-maintenance-command-pack`, `specs/324-symbol-identity-canonical-key-v2` y `specs/325-ambiguity-model-v2-query-engine`, además de `docs/done-log.md`. El carril build/legacy, la capa read-only/exportable, el soporte offline, la persistencia v2, el reporting técnico, las code actions seguras, los contratos agent-ready, el oracle cross-surface, la proof suite incremental, la policy v2 de query scope, la policy runtime de backpressure, la matriz visible cross-surface, el aislamiento multi-root, la recuperación limpia ante persistencia dañada, la compatibilidad versionada de snapshots/payloads exportables, la observabilidad local sin telemetría externa, la resiliencia del parser con fuzzing determinista, el pack de comandos de mantenimiento del core, la identidad canónica de símbolo y el modelo v2 de ambigüedad del query engine ya quedan estabilizados; el siguiente cuello de botella canónico pasa ahora a `B281`.

Trazas paralelas activas que no desplazan ese foco principal:

- mantenimiento verde del bloque `B241-B250` y del carril `B258-B279`, únicamente si aparece una regresión real;
- mantenimiento verde de `B279`/`B280` únicamente si aparece una regresión real en identidad canónica, ambigüedad o mezcla `solution-source`/`orca-staging`;
- no abrir `B282` o `B283` mientras `B281` siga resoluble dentro del orden pedido.

---

## 2. Por qué es prioritario

Este foco es prioritario porque `B280` ya cerró la clasificación canónica de ambigüedad del query engine; el siguiente gap defendible es endurecer override/overload/prototype vs implementation sobre una base que ya distingue identidad exacta, fallback ambiguo y conflictos de `sourceOrigin`:

- `B279` ya separó `buildSymbolKey` y `buildConflictFamilyKey`, fijó `references`/`rename` frente a `orca-staging` y publicó `identityKey` en manifest, dependency graph, API symbols y conflictos cross-project;
- `B280` ya distingue `distance-minimum`, `global-fallback` ambiguo y `source-origin-conflict` sin abrir un segundo motor semántico;
- el siguiente paso útil es reforzar resolución entre overloads, overrides, prototypes e implementations, no volver a abrir identidad ni ambigüedad v2.

---

## 3. Trabajo permitido ahora

- reforzar la resolución entre overloads, overrides, prototypes e implementations usando la identidad canónica de `B279` y la ambigüedad v2 de `B280` como base compartida;
- propagar ese hardening a definition, references, hover y signatureHelp sin volver a comparaciones planas por nombre;
- preservar verde `B279`/`B280` y el carril build/legacy/read-only/runtime/contract ya cerrado en `B258-B280`.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- reabrir `B279` o `B280` sin regresión real en `symbolKey.test.ts`, `semanticQueryService.test.ts`, `queryContext.test.ts`, `hoverFormat.test.ts`, `references.test.ts` o `rename.test.ts`;
- mezclar `B281` con nuevos reports de mantenimiento, nuevos parsers o telemetría externa;
- adelantar `B282` o `B283` mientras `B281` siga resoluble dentro del orden pedido.

---

## 5. Criterios de salida del foco actual

- `B281` queda cerrada con overload/override/prototype/implementation resueltos con evidence y tests negativos defendibles;
- el siguiente foco natural pasa a `B282`;
- `B279`/`B280` se mantienen como guardrails de identidad y ambigüedad canónica, y `B278`/`B272`/`B271`/`B269`/`B270`/`B276`/`B275`/`B274`/`B268`/`B273`/`B277`/`B267` como guardrails de observabilidad/compatibilidad/persistencia/hot path/soak/memoria/multi-root/visible/arquitectónico/runtime.

---

## 6. Siguiente foco natural

1. `B282` — Dynamic invocation risk model v2.
2. `B283` — Semantic confidence calibration over real corpora.

---

## 7. Regla final

`B281` debe reutilizar `B279`, `B280`, `B255`, `B273`, `B278`, `B271`, `B269`, `B270`, `B268` y `B277`; no debe reabrir identidad o ambigüedad v2 ni inventar resolución local por feature fuera del query engine compartido.