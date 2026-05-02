# Tasks - Spec 292 Safe batch rename/refactor planning (B249)

## 1. Preparacion

- [x] T1. Confirmar que el hueco real era una orquestacion batch read-only, no una nueva engine de rename.

## 2. Implementacion

- [x] T2. Reutilizar el safe edit planning sobre impacto ya calculado.
- [x] T3. Implementar el planner batch con estados honestos y publicarlo por contrato versionado.

## 3. Validacion

- [x] T4. Cubrir el planner y el contrato publico con tests focales y smoke basico.

## 4. Cierre

- [x] T5. Dejar la base lista para futuros carriles write-enabled sin exponer precision fingida.
