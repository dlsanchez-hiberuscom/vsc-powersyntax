# Tareas: Spec 005 — Workspace Symbols & Go to Definition

## 1. Bloques de Implementación

### Helper de identificación (B001)

- [x] **T1.** Crear `src/server/utils/wordAtPosition.ts` con lógica para extraer el identificador PB bajo el cursor.

### Workspace Symbols (B002)

- [x] **T2.** Crear `src/server/features/workspaceSymbols.ts` con `provideWorkspaceSymbols(query, kb)`.
- [x] **T3.** Exponer método `getAllEntities()` en `KnowledgeBase` para iterar sobre el índice.
- [x] **T4.** Registrar `workspaceSymbolProvider: true` en capabilities y handler en `server.ts`.

### Go to Definition (B003)

- [x] **T5.** Crear `src/server/features/definition.ts` con `provideDefinition(document, position, kb)`.
- [x] **T6.** Registrar `definitionProvider: true` en capabilities y handler en `server.ts`.

### Pruebas y Validación (B004)

- [x] **T7.** Escribir `test/server/unit/workspaceSymbols.test.ts`.
- [x] **T8.** Escribir `test/server/unit/definition.test.ts`.
- [x] **T9.** Verificar compilación y 100% tests verdes.

## 2. Orden recomendado

```text
Bloque 1 — Helper
  T1

Bloque 2 — Workspace Symbols
  T3 → T2 → T4

Bloque 3 — Go to Definition
  T5 → T6

Bloque 4 — Tests
  T7 → T8 → T9
```
