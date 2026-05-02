# Spec 292 - Safe batch rename/refactor planning (B249)

**Estado:** cerrada y validada.

## 1. Resumen

Planificar en modo read-only un batch de rename/refactor seguro reutilizando validacion, impact analysis y safe edit plan ya existentes, para exponer riesgos, bloqueos y pasos propuestos antes de cualquier edicion real.

## 2. Estado real actual

`B249` queda `Closed`: `src/server/features/safeBatchRefactorPlan.ts` orquesta el batch planner, `src/server/features/safeEditPlan.ts` expone el helper reutilizable sobre impacto ya calculado, `src/server/server.ts` lo publica como comando read-only y `src/client/extension.ts` lo expone por API publica y tool bridge.

## 3. Objetivo

Dar una capa de planificacion segura y honesta para operaciones batch antes de cualquier futuro carril write-enabled y antes del cierre de release.

## 4. Alcance

- aceptar multiples items de rename/refactor batch;
- reutilizar `validateRenameTarget`, `buildImpactAnalysis` y `buildSafeEditPlanFromImpact`;
- marcar items como `planned`, `blocked` o `skipped` con `stopOnBlocked`;
- exponer riesgos, tests sugeridos y docs afectadas por item y agregado.

## 5. Fuera de alcance

- ejecutar los edits reales sobre codigo;
- rename global no respaldado por evidencia/confianza suficiente;
- duplicar logica de impacto o validacion fuera de la pipeline actual.

## 6. Criterios de aceptacion

- AC1. Existe un planner batch read-only reutilizando gates ya existentes.
- AC2. El planner corta o marca items honestamente segun `stopOnBlocked` y riesgos detectados.
- AC3. La API publica y el tool bridge exponen el planner con contrato versionado.
- AC4. La implementacion evita una segunda engine de impacto o edit planning.

## 7. Documentacion afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/developer-workflows.md`
- `docs/roadmap.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "unit/(safeBatchRefactorPlan|publicApi)"`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`

## 9. Cierre registrado

- `src/server/features/safeEditPlan.ts` expone `buildSafeEditPlanFromImpact()` para reutilizacion.
- `src/server/features/safeBatchRefactorPlan.ts` implementa el planner batch read-only.
- `src/client/extension.ts`, `src/server/server.ts` y `src/shared/publicApi.ts` lo conectan al contrato publico y al bridge.
- `test/server/unit/safeBatchRefactorPlan.test.ts` fija estados `planned`, `blocked` y `skipped`.
