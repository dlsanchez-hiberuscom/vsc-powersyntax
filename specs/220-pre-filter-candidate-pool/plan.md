# Plan - Spec 220 Pool de candidatos previo al filtro (B157)

## 1. Resumen tecnico

Conservar el conjunto bruto de candidatos del winner path antes del filtro final y devolverlo como `candidatePool` dentro de `ResolvedTargetInfo`.

## 2. Estado actual

- el query engine genera candidatos intermedios en rutas jerárquicas, cualificadas y globales;
- el filtro final deja solo el ganador o el conjunto mínimo y descarta el pool bruto.

## 3. Diseno propuesto

- anadir un contrato `QueryCandidate` pequeño y estable;
- capturar el pool bruto antes de `sortAndFilterByDistance()`;
- propagarlo al resultado detallado sin alterar `targets`.

## 4. Impacto en el runtime

- prepara slices posteriores de descartes y ambigüedad;
- no cambia el comportamiento visible de features ya existentes.

## 5. Riesgos tecnicos

- capturar el pool después del filtro en vez de antes;
- duplicar información con `targets` sin una frontera clara.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/semanticQueryService"`

## 7. Documentacion a actualizar

- `docs/done-log.md`