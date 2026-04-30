# Spec 057 — Query trace (B136)

## Motivación
Permitir trazar (debug/telemetry) la cadena de razonamiento de queries
del knowledge base sin acoplar telemetría a cada feature.

## Alcance
- `src/server/knowledge/queryTrace.ts`:
  - `withTrace<T>(label, fn): { result: T; trace: TraceStep[] }`.
  - `recordTraceStep(name, detail?)` válido solo dentro de `withTrace`.
- Tests.

## Criterios
1. Trace contiene los pasos en orden.
2. Fuera de `withTrace`, `recordTraceStep` no falla y se descarta.
