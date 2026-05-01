# Plan - Spec 221 Motivos de descarte por distancia (B157)

## 1. Resumen tecnico

Convertir el filtro por distancia en una pequeña estructura de ranking que conserve también los candidatos descartados y sus distancias relativas.

## 2. Estado actual

- `sortAndFilterByDistance()` devuelve solo el conjunto ganador mínimo;
- el pool bruto ya está disponible, pero no existe motivo formal de descarte.

## 3. Diseno propuesto

- introducir un helper interno que devuelva ganadores y descartes por distancia;
- proyectar esos descartes a `evidence` como `discarded-distance`;
- reutilizar la misma distancia del algoritmo actual.

## 4. Impacto en el runtime

- añade explicabilidad sin cambiar el target final;
- prepara la siguiente ola de evidence sobre descartes y ambigüedad.

## 5. Riesgos tecnicos

- recalcular distancias de forma distinta al algoritmo existente;
- inflar el payload de `evidence` más allá del boundary local.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/semanticQueryService"`

## 7. Documentacion a actualizar

- `docs/done-log.md`