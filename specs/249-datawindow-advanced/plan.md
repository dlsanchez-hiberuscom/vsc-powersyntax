# Plan - Spec 249 DataWindow avanzado (B042)

## 1. Enfoque tecnico

Avanzar en slices pequenos. La primera decision obligatoria es separar un `DataWindowModel` puro de cualquier mapper LSP antes de anadir nuevas propiedades o expresiones.

## 2. Pasos

1. Inventariar lo que hoy vive en `dataWindowSafeMode` y `dataWindowLegacySafeMode`.
2. Extraer `dataWindowModel` reutilizable sin mezclarlo con los mappers LSP visibles.
3. Anadir el primer corte avanzado resoluble sobre `.srd` y bindings `DataObject` literales: `report(...)`, `dddw.name` y `Describe/Modify(...DataWindow.Table.Select)`.
4. Reutilizar el modelo desde hover/definition/symbols.
5. Validar y actualizar docs.

## 3. Resultado ejecutado

- `src/server/features/dataWindowModel.ts` concentra el modelo/query reutilizable del `.srd`.
- `dataWindowLegacySafeMode`, `hover`, `definition` y `documentSymbols` consumen ya ese modelo.
- El slice avanzado cerrado cubre relaciones child por `report(...)` y `dddw.name`, además de property paths `Describe/Modify` contra `Table.Select` cuando la cadena es determinista.

## 4. Riesgos

- crear un segundo motor DataWindow paralelo;
- subir coste en hot path de archivo activo;
- publicar confidence demasiado alta para propiedades dinamicas.

## 5. Validacion

- unit tests DataWindow focalizados;
- integration LSP si cambia hover/definition/documentSymbols;
- performance si aumenta parsing de `.srd`.
