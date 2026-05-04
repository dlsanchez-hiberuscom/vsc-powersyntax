# Spec 400 — B310 Object lifecycle risk report v2

## Estado

- done

## Relacion backlog

- Backlog item: `B310 — Object lifecycle risk report v2`

## Objetivo

Elevar señales lifecycle `create/destroy/constructor/destructor` a reportes de riesgo y modernización reutilizando los diagnósticos y métricas ya existentes, sin abrir un motor nuevo.

## Resultado de cierre

- `src/server/features/powerBuilderTechnicalDebtReport.ts` publica ya el hotspot `lifecycle-risk` cuando existen warnings `missing-super-*`, `missing-trigger-*` o `unresolved-*`, con evidencia desglosada `diagnostic:lifecycle-*` y summary `lifecycleRiskFindings`;
- el mismo debt report reutiliza `objectEntry.metrics.lifecycleWarnings` y lo proyecta en el hotspot, evitando recomputar lifecycle fuera del snapshot de diagnostics y de `code metrics`;
- `src/client/extension.ts` incorpora esa proyección en el Markdown del informe técnico, mostrando el resumen `lifecycle` y el contador de warnings lifecycle por hotspot sin abrir una surface paralela;
- `test/server/unit/powerBuilderTechnicalDebtReport.test.ts`, `powerBuilderCodeMetrics.test.ts` y `diagnostics.test.ts` mantienen verde el triángulo `diagnostics -> metrics -> technical debt report`.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(diagnostics|powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|publicApi)"`

## Fuera de alcance del corte cerrado

- crear diagnósticos lifecycle nuevos fuera de la familia `missing-super-*`, `missing-trigger-*`, `unresolved-*` ya emitida;
- abrir quick fixes write-enabled para reparar `create/destroy` o hooks de lifecycle;
- inferir o ejecutar comportamiento de PBX/PBNI/DLL externas; eso queda para `B308`.