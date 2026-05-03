# Spec 297 - powerbuilder dependency graph visual exportable (B252)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B252` como grafo read-only de vecindario inmediato sobre la base semántica ya publicada, con payload JSON estable, export Mermaid y una vista visual desde la extensión sin abrir una segunda engine de dependencias.

## 2. Estado real actual

La API pública v2.5.0 expone `getPowerBuilderDependencyGraph()` y el tool `dependency-graph`. El servidor calcula dependencias y dependientes inmediatos a partir de snapshots, evidencias semánticas y reverse dependencies del `KnowledgeBase`, mientras el cliente abre un Markdown con Mermaid en preview lateral.

## 3. Objetivo

Dar una surface navegable y exportable para inspeccionar dependencias PowerBuilder inmediatas de un objeto/archivo activo sin rescans del workspace ni recomputación semántica ad hoc.

## 4. Alcance

- publicar un contrato estable para el grafo inmediato de dependencias;
- resolver dependencias, ambigüedades y dependientes inversos desde el pipeline ya indexado;
- exponer el grafo por API pública, tool bridge read-only y comando visual en la extensión;
- cubrir el slice con tests unitarios y smoke;
- alinear documentación viva y mover el foco canónico a `B253`.

## 5. Fuera de alcance

- construir un grafo transitive/global del workspace completo en hot path;
- recalcular semántica al pedir el grafo;
- fingir resolución única cuando existan definiciones ambiguas cross-project.

## 6. Criterios de aceptación

- AC1. la API pública expone `getPowerBuilderDependencyGraph()` y `ApiPowerBuilderDependencyGraph`.
- AC2. el tool read-only `dependency-graph` devuelve el mismo payload estable.
- AC3. el grafo incluye dependencias `inherits` / `depends-on`, dependientes `used-by`, y marca resolución `resolved|ambiguous|unresolved`.
- AC4. la extensión abre una vista Markdown/Mermaid funcional para el objeto activo.
- AC5. backlog, roadmap y current-focus dejan de tratar `B252` como deuda activa y pasan a `B253`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dependencyGraph.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 9. Cierre registrado

- el producto puede exportar y visualizar un grafo inmediato de dependencias sin tocar el motor semántico más allá de las surfaces ya publicadas;
- agentes y tooling disponen del mismo payload por API pública y tool bridge;
- el siguiente foco canónico pasa a `B253`.
