# Tareas: Spec 007 — Document Symbols Jerárquicos y Scopes Base

## 1. Base de Scopes (B020)

- [x] **T1.** Actualizar `src/server/knowledge/types.ts` para que `Entity` y `SymbolFact` soporten el campo `containerName`.
- [x] **T2.** Actualizar `src/server/analysis/documentAnalysis.ts` (si es necesario) o la lógica de `KnowledgeBase` para popular `containerName` usando el contexto estructural básico.

## 2. Document Symbols Jerárquicos (B014)

- [x] **T3.** Modificar `src/server/utils/helpers.ts` para que `createSymbol` devuelva un `DocumentSymbol` que inicialice su array `children: []`.
- [x] **T4.** Refactorizar `src/server/features/documentSymbols.ts` para utilizar una pila (`stack`). Al encontrar tipos o forward declarations, hacer push; al cerrar bloques, hacer pop, anidando los hijos descubiertos entre medio.

## 3. Validación y Pruebas

- [x] **T5.** Actualizar los tests unitarios en `test/server/unit/documentSymbols.test.ts` para asertar la jerarquía (`children`).
- [x] **T6.** Compilar y pasar tests unitarios e integración (`npm run test:unit`, `npm run test:performance`).
