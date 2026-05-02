# Plan 007 - Document Symbols jerárquicos y scopes base

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- extender el modelo semántico para conservar `containerName`;
- construir `DocumentSymbol.children` con una pila de scopes/bloques en lugar de una lista plana;
- fijar el outline jerárquico con tests unitarios como base para refuerzos posteriores.

## Resultado histórico observado

- el outline jerárquico quedó operativo y más tarde fue endurecido con reconciliación parser/snapshot/LSP;
- la carpeta original no tenía `spec.md` ni `plan.md`, aunque las tareas ya estaban cerradas.