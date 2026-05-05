# Plan — Spec 421 / SYM-01

- Gap consolidado: mixed-root / cross-project ambiguity sin widening a `workspace` y sin relajar `sourceOrigin` para rename/references.
- Primer slice elegido: coherencia project-scoped entre `workspaceSymbols`, `references`, `rename` y `crossProjectSymbolConflicts` antes de abrir mejoras de UX o widening global.
- No-go explícitos: no rename sobre `orca-staging/generated`, no edición con `invocationRisk` dinámico/fallback/external, no scans globales nuevos en hot path.
- Validación focal futura:
	- `npx mocha --ui tdd out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`
	- `npx mocha --ui tdd out/test/server/unit/hotPathAllocationBudget.test.js`
