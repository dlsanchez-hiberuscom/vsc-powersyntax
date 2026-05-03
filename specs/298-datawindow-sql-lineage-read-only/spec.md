# Spec 298 - datawindow SQL lineage read only (B253)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B253` como lineage SQL read-only de DataWindow reutilizando el backbone semántico ya indexado para `retrieve`, report children, dropdown children y bindings `DataObject` reales, sin abrir parsing paralelo ni una segunda engine semántica.

## 2. Estado real actual

La API pública v2.6.0 expone `getDataWindowSqlLineage()` y el tool `datawindow-sql-lineage`. El servidor construye el árbol de lineage desde `DataWindowModel`, `collectDataObjectBindings()` y `resolveDataWindowDefinitionTargets()`, mientras el cliente abre un Markdown lateral reutilizable incluso cuando el resultado degrada a `available: false`.

## 3. Objetivo

Dar una surface defendible y exportable para inspeccionar el lineage SQL real de un DataWindow raíz sin reindexar el workspace ni recalcular semántica ad hoc fuera del pipeline existente.

## 4. Alcance

- publicar un contrato estable para el lineage SQL de DataWindow;
- resolver raíz desde `.srd` activo, binding `DataObject` literal o `dataObjectName` explícito;
- recorrer `retrieve`, report children y dropdown children sobre el modelo ya indexado;
- exponer el lineage por API pública, tool bridge read-only y comando visual en la extensión;
- cubrir el slice con tests unitarios y smoke;
- alinear documentación viva y mover el foco canónico a `B254`.

## 5. Fuera de alcance

- recalcular semántica del workspace al pedir el lineage;
- fingir rutas únicas cuando existan targets ambiguos o bindings dinámicos;
- introducir write actions o edición automática sobre DataWindow.

## 6. Criterios de aceptación

- AC1. la API pública expone `getDataWindowSqlLineage()` y `ApiDataWindowSqlLineage`.
- AC2. el tool read-only `datawindow-sql-lineage` devuelve el mismo payload estable.
- AC3. el lineage refleja `retrieve`, report children y dropdown children con estados `resolved|missing|ambiguous|dynamic`.
- AC4. la extensión abre una vista Markdown funcional para el editor activo o para degradación explícita cuando no haya raíz resoluble.
- AC5. backlog, roadmap y current-focus dejan de tratar `B253` como deuda activa y pasan a `B254`.

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
- `npx mocha --ui tdd out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 9. Cierre registrado

- el producto puede exportar y visualizar lineage SQL de DataWindow sin tocar el motor semántico más allá de surfaces ya publicadas;
- agentes y tooling disponen del mismo payload por API pública y tool bridge;
- el siguiente foco canónico pasa a `B254`.