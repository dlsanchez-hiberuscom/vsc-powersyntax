# Tasks — Spec 416

## Estado

- done

## Tasks

- [x] Centralizar una policy ligera de knowledge packs basada en owner types curados + `sourceOrigin`.
- [x] Proyectar `frameworkKnowledgeConflict` en `querySymbols`, `currentObjectContext`, `impactAnalysis` y `safeEditPlan` sin tocar el winner real del query engine.
- [x] Hacer visible la policy en `object-check` y en el panel de current object context.
- [x] Validar el slice con compile focal, suites unitarias tocadas y `npm run test:docs:drift`.

## Riesgos residuales registrados

- La policy degrada packs a contexto advisory; si en el futuro se amplían los knowledge packs, debe mantenerse ese contrato sin abrir otro motor de resolución.
- Los owner types curados siguen siendo una allowlist explícita; ampliar cobertura de frameworks queda fuera de este corte y no debe mezclarse con ADR-0001 del catálogo.