# Plan — Spec 137 Reverse Semantic Dependencies (B153)

## 1. Resumen tecnico

El trabajo debe apoyarse en src/server/knowledge/KnowledgeBase.ts, src/server/knowledge/resolution/InheritanceGraph.ts, src/server/knowledge/resolution/libraryOrder.ts y src/server/workspace/projectRegistry.ts para no duplicar relaciones ya modeladas.

## 2. Estado actual

- El proyecto ya dispone de KnowledgeBase, InheritanceGraph y projectRegistry.
- No hay un indice inverso formal que centralice el impacto semantico entre documentos.

## 3. Diseno propuesto

- Derivar dependencias por documento desde snapshots y estructuras compartidas.
- Construir un reverseDependencyGraph incremental o reconstruible por lote controlado.
- Exponer un resolvedor de documentos impactados con razon minima del impacto.
- Preparar al scheduler para consumir el conjunto impactado sin recalcular mas de lo necesario.

## 4. Impacto en rendimiento

- Positivo porque habilita invalidacion fina y priorizacion por valor semantico.
- Riesgo de coste extra al mantener el grafo si no se limita a relaciones de alto valor.

## 5. Riesgos tecnicos

- Duplicar relaciones que ya viven en InheritanceGraph o projectRegistry.
- No representar bien dependencias transitivas importantes.
- Acoplar el resolvedor de impacto a detalles temporales del scheduler.

## 6. Estrategia de validacion

- Tests unitarios del extractor de dependencias.
- Tests de integracion del impactedDocumentsResolver.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- specs de invalidacion y priorizacion que dependan del grafo inverso