# Spec 398 — B311 Transaction and DataWindow update flow analyzer

## Estado

- done

## Relacion backlog

- Backlog item: `B311 — Transaction and DataWindow update flow analyzer`

## Objetivo

Analizar flujos `SetTransObject/SetTrans/Retrieve/Update` y proyectar su riesgo real en code metrics y technical debt report sin abrir un parser paralelo ni un motor nuevo de scoring.

## Resultado de cierre

- `src/server/features/powerBuilderTechnicalDebtReport.ts` mantiene ya `datawindow-risk` aunque el binding no resuelva un `.srd` único, siempre que existan evidencias defendibles en `diagnostic.code` para `dataobject-*`, `transaction-binding-*` o `retrieve-arity-mismatch`;
- el debt report añade evidencia específica por `dataobject-binding`, `transaction-binding`, `retrieve-arity` y `datawindow-path`, evitando colapsar todo el riesgo DataWindow en un contador opaco;
- `src/server/features/powerBuilderCodeMetrics.ts` proyecta ya contadores por objeto y summary para `dataObjectBindingDiagnostics`, `transactionBindingDiagnostics` y `retrieveArityDiagnostics`, reutilizando el mismo snapshot de diagnostics;
- el resultado reutiliza `diagnostic.code`, `code-metrics`, `technical-debt-report` y `DataWindow SQL lineage` ya existentes, sin tocar ORCA ni abrir una surface nueva.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport)"`

## Fuera de alcance del corte cerrado

- clasificar riesgo de SQL dinámico más allá del flujo DataWindow/transaction actual; eso queda para `B312`;
- abrir diagnósticos nuevos o un parser SQL dinámico general;
- convertir estos reportes en una acción write-enabled.