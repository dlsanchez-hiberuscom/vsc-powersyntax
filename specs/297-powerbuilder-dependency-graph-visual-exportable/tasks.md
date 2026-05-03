# Tasks - Spec 297 powerbuilder dependency graph visual exportable (B252)

## 1. Preparación

- [x] T1. Confirmar que `KnowledgeBase` ya publica snapshots y reverse dependencies suficientes para un grafo inmediato.
- [x] T2. Identificar el owning abstraction del slice en un feature server-side nuevo junto a manifest/impact analysis.

## 2. Implementación

- [x] T3. Implementar el builder read-only del grafo inmediato en `src/server/features/dependencyGraph.ts`.
- [x] T4. Exponer `getPowerBuilderDependencyGraph()` y `dependency-graph` en la API pública endurecida.
- [x] T5. Añadir el comando visual `PowerSyntax: Abrir Grafo de Dependencias PowerBuilder` con Mermaid preview.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/dependencyGraph.test.js out/test/server/unit/publicApi.test.js`.
- [x] T9. Ejecutar `npm run test:smoke -- --grep "la extensión se activa"`.

## 4. Cierre

- [x] T10. Mover `B252` a `docs/done-log.md` y dejar `B253` como foco siguiente.
