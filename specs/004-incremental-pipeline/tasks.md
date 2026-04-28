# Tareas: Spec 004 — Incremental Knowledge Pipeline

## 1. Bloques de Implementación

### Definición del Dominio (B001)

- [x] **T1.** Crear `src/server/knowledge/types.ts` definiendo las estructuras para `Fact`, `Entity`, `Reference`, y `Relation`.

### Caché Documental (B002)

- [x] **T2.** Crear `src/server/knowledge/DocumentCache.ts` con control de hash por contenido y versión LSP.
- [x] **T3.** Implementar métodos para obtener, hacer upsert, e invalidar entradas.

### Base de Conocimiento (KnowledgeBase) (B003)

- [x] **T4.** Crear `src/server/knowledge/KnowledgeBase.ts`.
- [x] **T5.** Implementar `upsertDocument(uri, facts)`.
- [x] **T6.** Implementar estructuras de consulta (`findDefinition`, `findReferences`).

### Refactor de Extracción (B004)

- [x] **T7.** Modificar `src/server/analysis/documentAnalysis.ts` para que genere instancias concretas de `Fact` en lugar de simple metadata suelta.

### Indexador de Fondo (B005)

- [x] **T8.** Crear `src/server/indexer/workspaceIndexer.ts`.
- [x] **T9.** Implementar la función iteradora que consuma `WorkspaceState.getAllSourceFiles()`, lea el FS, verifique el `DocumentCache` y ejecute `analyzeDocument`.
- [x] **T10.** Integrar el Indexer en `server.ts`, invocándolo a través del `TaskScheduler` inmediatamente después de completarse el Descubrimiento (Spec 003).

### Pruebas y Validación (B006)

- [x] **T11.** Escribir `test/server/unit/knowledgeBase.test.ts` y `documentCache.test.ts`.
- [x] **T12.** Escribir `test/server/performance/indexer.perf.test.ts` sobre el corpus local.

## 2. Orden recomendado

```text
Bloque 1 — Dominio
  T1

Bloque 2 — Memoria
  T2 → T3 → T4 → T5 → T6

Bloque 3 — Extracción
  T7

Bloque 4 — Ejecución Background
  T8 → T9 → T10

Bloque 5 — Tests
  T11 → T12
```
