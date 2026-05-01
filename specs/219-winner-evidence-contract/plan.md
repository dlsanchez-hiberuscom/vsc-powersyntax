# Plan - Spec 219 Evidence del ganador semantico (B157)

## 1. Resumen tecnico

Introducir un contrato `evidence` pequeno en `ResolvedTargetInfo`, derivado unicamente del ganador actual y de la informacion ya calculada por `reasonCodes` y `winnerLineage`.

## 2. Estado actual

- `resolveTargetEntityDetailed()` devuelve `targets`, `reasonCodes`, `winnerLineage` y `trace`.
- Un consumer que quiera evidence estructurada todavia debe recomponerla manualmente.

## 3. Diseno propuesto

- crear una shape `QueryEvidence` extensible;
- poblar un primer item `winner-target` cuando haya target ganador;
- mantener la logica derivada dentro de `semanticQueryService`.

## 4. Impacto en el runtime

- prepara `B157` sin tocar todavia providers ni surfaces publicas;
- evita duplicar la recomposicion de evidence en consumers futuros.

## 5. Riesgos tecnicos

- duplicar informacion de `winnerLineage` sin una frontera clara;
- dejar la shape demasiado especifica para crecer luego con descartes.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/semanticQueryService"`

## 7. Documentacion a actualizar

- `docs/done-log.md`