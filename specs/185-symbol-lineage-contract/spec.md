# Spec 185 - Contrato base de lineage para símbolos (B172)

## 1. Resumen

Introducir un payload formal y mínimo de `lineage` en `Entity` para modelar origen, fase, rol de implementación, herencia y fiabilidad base.

## 2. Problema

Las siguientes slices de `B172` necesitan un vocabulario común; si parser, enriquecimiento, resolución y hover inventan cada uno sus propios campos, el backlog se fragmenta.

## 3. Objetivo

Definir un contrato de `lineage` reusable dentro del modelo semántico principal.

## 4. Alcance

- Añadir tipos base de lineage en `src/server/knowledge/types.ts`.
- Exponer `lineage?: EntityLineage` dentro de `Entity`.
- Mantener el contrato lo bastante pequeño para los siguientes pasos 186-192.

## 5. Fuera de alcance

- Poblar lineage desde el parser.
- Normalizar campos derivados.
- Exponer lineage en hover o API pública.

## 6. Requisitos

- R1. El contrato debe cubrir origen, fase, rol de implementación, herencia y fiabilidad base.
- R2. Debe usar un vocabulario compatible con provenance del catálogo cuando sea razonable.
- R3. No debe romper compile ni consumidores existentes.

## 7. Criterios de aceptacion

- AC1. `Entity` expone un campo opcional `lineage`.
- AC2. El contrato es lo bastante general para parser, resolución y surfaces.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Sobrediseñar el contrato antes de conectarlo elevaría el coste de 186-192.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.