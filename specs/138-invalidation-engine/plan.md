# Plan — Spec 138 Invalidation Engine (B154)

## 1. Resumen tecnico

La implementacion debe unificar llamadas hoy dispersas en src/server/server.ts, src/server/analysis/analysisCache.ts, src/server/knowledge/DocumentCache.ts, src/server/knowledge/HotContextCache.ts y src/server/knowledge/ServingCache.ts.

## 2. Estado actual

- El servidor invalida caches y reprograma trabajo desde varios puntos.
- No existe un plan central que explique por que se invalida cada capa.
- El diff semantico y el grafo inverso todavia deben integrarse como entradas del motor.

## 3. Diseno propuesto

- Introducir un modulo de invalidation engine en runtime o knowledge.
- Normalizar entradas de cambio: local, estructural, semantico ampliado, cierre, borrado y refresh global.
- Construir un plan con invalidaciones de caches, bump de epoch y documentos a reindexar.
- Hacer que server.ts invoque ese plan y delegue su ejecucion al scheduler.

## 4. Impacto en rendimiento

- Positivo al evitar invalidaciones redundantes y facilitar selective reindex.
- Debe evitar coste extra en casos triviales usando fast paths.

## 5. Riesgos tecnicos

- Intentar migrar todos los llamadores en una sola pasada.
- Duplicar reglas entre el engine y consumers legacy.
- No distinguir bien invalidacion inmediata frente a trabajo reprogramado.

## 6. Estrategia de validacion

- Tests unitarios de buildInvalidationPlan.
- Tests de integracion sobre server.ts y caches afectadas.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si la capa runtime asume explicitamente el ownership del engine