# Plan - Spec 305 advanced PowerBuilder code metrics (B260)

## 1. Enfoque técnico

Usar el backbone semántico ya publicado como única fuente de verdad: el collector debe vivir sobre `KnowledgeBase`, `DiagnosticsSnapshot`, bindings `DataObject` y `WorkspaceState`, y la surface pública debe seguir el patrón read-only ya usado por dependency graph, migration assistant y build profile matrix.

## 2. Pasos

1. Implementar el collector server-side de métricas avanzadas por objeto y resumen global.
2. Exponer el contrato por API pública, tool read-only y comando Markdown cliente-side.
3. Validar collector, contrato público y wiring smoke del host real.
4. Alinear documentación viva y mover el foco canónico a `B261`.

## 3. Riesgos

- abrir un segundo motor semántico o reparsear código fuera del snapshot publicado;
- presentar métricas como precisión absoluta cuando solo son defendibles dentro de límites explícitos;
- degradar el hot path por materializar listas globales sin truncado.

## 4. Validación

- `npm run build:test`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 5. Resultado ejecutado

1. El collector ya publica métricas defendibles por objeto, diagnostics por área y footprint build/ORCA usando la base semántica real.
2. La extensión ya expone el reporte por API pública, tool read-only y comando Markdown.
3. El foco canónico del repo pasa a `B261`.