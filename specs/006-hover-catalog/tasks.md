# Tareas: Spec 006 — Catálogo Oficial y Hover Enriquecido

**Estado histórico:** cerrada y normalizada por B233.

## 1. Bloques de Implementación

### Tipos de Datos (B001)

- [x] **T1.** Crear `src/server/knowledge/system/types.ts` extrayendo las definiciones limpias desde el `plugin_old` (`PbSystemSymbolEntry`, firmas, dominios).

### Migración de Catálogo (B002)

- [x] **T2.** Crear carpeta `src/server/knowledge/system/manual/`.
- [x] **T3.** Copiar y adaptar `common.ts` y todos los datasets (`globalFunctions.ts`, `objectFunctions.ts`, `dataWindowFunctions.ts`, `systemEvents.ts`, `dataWindowEvents.ts`, `statements.ts`) a la nueva ruta y con las nuevas importaciones.

### Servicio SystemCatalog (B003)

- [x] **T4.** Crear `src/server/knowledge/system/SystemCatalog.ts` que lea todos los arrays estáticos y construya un `Map` por nombre en minúsculas.
- [x] **T5.** Crear test unitario `test/server/unit/systemCatalog.test.ts`.

### Hover Enriquecido (B004)

- [x] **T6.** Actualizar `src/server/features/hover.ts` para que resuelva primero en `SystemCatalog` (renderizando Markdown con firma y docs) y luego en `KnowledgeBase`.
- [x] **T7.** Inyectar `SystemCatalog` en `server.ts`.
- [x] **T8.** Crear test unitario `test/server/unit/hover.test.ts`.

### Validación Final (B005)

- [x] **T9.** Compilar y pasar todos los tests.
