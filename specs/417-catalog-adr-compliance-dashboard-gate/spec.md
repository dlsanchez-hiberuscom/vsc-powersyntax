# Spec 417 — B335 Catalog ADR-0001 compliance dashboard and consistency gate

## Estado

- done

## Relación backlog

- Backlog item: `B335 — Catalog ADR-0001 compliance dashboard and consistency gate`

## Objetivo

Publicar un dashboard/gate reproducible que valide el cumplimiento de `ADR-0001` sobre el catálogo real, manteniendo `generated-primary-with-manual-overlays` como política contractual y dejando el audit fuera del hot path interactivo.

## Resultado de cierre

- `src/server/features/workspaceCheckCatalogSummary.ts` reconsume `buildCatalogConsistencyReport()` y la merge policy real del query layer para publicar `adrCompliance` con policy recomendada, dominios `manual-primary`, coverage drift, `candidateHotPathViolations` y drift de localización documental;
- `src/client/workspaceCheckReport.ts` eleva ese estado a findings/status/Markdown del `workspace-check`, de modo que el gate ADR-0001 puede fallar el summary sin reabrir la decisión del ADR ni introducir otro rail de catálogo;
- `scripts/generate_catalog_consistency_report.cjs` y `package.json` publican `npm run report:catalog-consistency`, serializando JSON/Markdown determinista bajo `artifacts/catalog/` sobre el mismo baseline contractual `generated-primary-with-manual-overlays`.

## Validación ejecutada

- `npm run compile`
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogAdoptionDecision.test.js out/test/server/unit/catalogProvenanceAudit.test.js out/test/server/unit/systemCatalogQueryHardening.test.js out/test/server/unit/workspaceCheckCatalogSummary.test.js out/test/server/unit/workspaceCheckReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run report:catalog-consistency`
- `npm run test:docs:drift`

## Fuera de alcance del corte cerrado

- reabrir `ADR-0001` o decidir otra vez `generated-primary` vs `manual-primary`;
- mover el dashboard/gate ADR-0001 a `hover`, `completion`, `signatureHelp` o `diagnostics` del hot path;
- convertir `candidate` en serving interactivo o duplicar símbolos/localización para forzar el gate.