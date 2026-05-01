# Spec 189 - Winner lineage en semanticQueryService (B172)

## 1. Resumen

Extender `resolveTargetEntityDetailed` para devolver un resumen de lineage del target ganador junto a `reasonCodes` y `trace`.

## 2. Problema

El servicio detallado de resolución ya sabe por qué ganó un target, pero no expone todavía un lineage listo para consumir por features de serving.

## 3. Objetivo

Añadir `winnerLineage` al resultado detallado de resolución semántica.

## 4. Alcance

- Derivar un resumen de lineage del primer target resuelto.
- Añadir `resolutionKind` y confianza base cuando falten.
- Cubrirlo con tests del winner path existente.

## 5. Fuera de alcance

- Exponer lineage en hover.
- Bridge con catálogo de sistema.
- API pública externa.

## 6. Requisitos

- R1. `resolveTargetEntityDetailed` debe devolver `winnerLineage` cuando haya winner.
- R2. Debe incluir `resolutionKind` y una confianza base útil.
- R3. No debe romper consumidores existentes del servicio.

## 7. Criterios de aceptacion

- AC1. El winner path expone lineage del target ganador.
- AC2. El test del slice demuestra `winnerLineage` coherente con el reason code.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Si cada feature recompone lineage por su lado, B172 pierde valor como infraestructura común.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.