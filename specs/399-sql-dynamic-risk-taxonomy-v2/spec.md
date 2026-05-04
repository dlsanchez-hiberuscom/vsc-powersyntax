# Spec 399 — B312 SQL dynamic risk taxonomy v2

## Estado

- done

## Relacion backlog

- Backlog item: `B312 — SQL dynamic risk taxonomy v2`

## Objetivo

Clasificar riesgo de SQL embebido/dinámico con `reasonCodes` defendibles para `impactAnalysis`, `safeEditPlan` y reportes read-only, sin intentar parsear SQL dinámico no defendible ni abrir un motor nuevo.

## Resultado de cierre

- `src/server/features/dynamicStringReferences.ts` ya etiquetaba `api = dynamic-sql` cuando el identificador aparece dentro de un literal ligado a `execute immediate`, `prepare` o `declare`; el cierre reutiliza esa señal existente en vez de abrir un parser SQL paralelo;
- `src/server/features/invocationRiskModel.ts` conserva `dynamic-strings:n` como contador genérico y añade `dynamic-sql:n` solo cuando la evidencia ya es defendible, evitando contaminar otros APIs dinámicos no SQL;
- `safeEditPlan` hereda esa taxonomía específica a través de `impactAnalysis` sin abrir un segundo motor, mientras `technical-debt-report` mantiene el hotspot `dynamic-sql` con evidencia y `confidence` explícitas para la surface de reportes;
- `test/server/unit/invocationRiskModel.test.ts` y `safeEditPlan.test.ts` fijan el reason code SQL específico, y `codeActions.test.ts` sigue verde para los casos dinámicos no SQL.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(invocationRiskModel|safeEditPlan|codeActions)"`
- `npm run test:unit -- --grep "unit/powerBuilderTechnicalDebtReport"`

## Fuera de alcance del corte cerrado

- intentar resolver o parsear SQL dinámico arbitrario más allá de la evidencia publicada;
- introducir `diagnostic.code` nuevos solo para materializar este riesgo;
- extender reason codes específicos a APIs dinámicos no SQL fuera del alcance de `B312`.