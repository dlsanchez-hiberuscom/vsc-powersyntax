# Spec: PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01
- **Título:** Matriz explícita de qualifiers y owner semantics para this, parent, super y global scope
- **Estado:** Open
- **Prioridad:** P1
- **Orden recomendado:** 09
- **Área:** Semántica, Qualifiers

## 2. Objetivo
Formalizar el soporte a *qualifiers* (calificadores de alcance) que actualmente fallan o resuelven con heurísticas débiles, específicamente los operadores especiales y palabras reservadas como `global::`, `ParentWindow()`, y accesos estáticos del tipo `type::member`.

## 3. Principios de Diseño
1. **Degradación Honesta:** Si un qualifier está muy lejos del árbol AST o no puede mapearse en el índice actual, es preferible degradarlo formalmente a "desconocido" (con reason code) antes que inventar un falso positivo.
2. **Identidad OOP Pura:** Considerar a `ParentWindow()` como invocación funcional y no como pseudo-pronombre; tratar `global::` como un constraint cerrado de scope global.

## 4. Alcance y Tareas
1. **Redactar Spec:** Este documento rige la matriz de soporte.
2. **Soporte Global explícito:** Implementar validaciones en el resolver semántico para limitar candidates cuando el pre-fijo explícito es `global::` o `::`.
3. **Soporte OOP Avanzado:** Aumentar soporte/tests para `Super::method()`, `Parent.member()`, y `This.member`.

## 5. Criterios de Aceptación
- Hover y definition de `::gs_value`, `This.is_value`, `Parent.uf_save()`, `Super::uf_save()` y `ParentWindow()` apuntan al target correcto o arrojan degradación limpia y declarada.
- Documentación owner (`technical-guide`) clara sobre matriz de soporte.

## 6. Documentación afectada
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture-status.md`
- `docs/testing.md`

## 7. Notas de Dependencia
Depende de `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01` para asegurar que los cambios incidan uniformemente en todos los consumers.
