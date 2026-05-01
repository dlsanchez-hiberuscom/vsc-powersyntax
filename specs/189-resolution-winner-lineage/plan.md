# Plan - Spec 189 Winner lineage en semanticQueryService (B172)

## 1. Resumen tecnico

Añadir un helper local que derive `winnerLineage` desde el primer target y el primer `reasonCode`, preservando lineage explícito del target cuando exista.

## 2. Estado actual

- `ResolvedTargetInfo` expone `targets`, `reasonCodes` y `trace`.
- No expone lineage listo para consumir.

## 3. Diseno propuesto

- Nuevo tipo `ResolvedWinnerLineage`.
- `winnerLineage` en `ResolvedTargetInfo`.
- Defaults de confianza basados en `reasonCode` si faltan.

## 4. Impacto en rendimiento

- Despreciable; usa el target ya resuelto.

## 5. Riesgos tecnicos

- Duplicar conceptos de `reasonCodes` y `winnerLineage` sin una frontera clara.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "winner path"
- npm run compile
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md