# Spec 323 - core maintenance command pack (B278)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B278` exponiendo un pack homogéneo de comandos seguros para inspección y mantenimiento del core, reutilizando stats, dashboard, manifest, `currentObjectContext`, conflictos cross-project, support bundle y persistencia v2 ya existentes.

## 2. Estado real actual

El repo ya dispone de un catálogo tipado del pack en `src/client/coreMaintenanceCommandCatalog.ts`, de comandos cliente explícitos para exportar health report, mostrar budgets/indexing/routing/sourceOrigin, validar o limpiar caché persistente y relanzar indexación, además de un rail servidor mínimo para `validatePersistentCache` y `clearSemanticCache`. `package.json` contribuye ya esos comandos, `test/server/unit/coreMaintenanceCommandCatalog.test.ts` fija el modelo read-only/confirmable y las smokes `test/smoke/extension.test.ts` y `test/smoke/health-report.extension.test.ts` validan wiring y export real del health report.

## 3. Objetivo

Ofrecer un pack de mantenimiento seguro para inspeccionar y sanear el runtime sin abrir rails paralelos de observabilidad ni lógica duplicada fuera del backbone ya publicado.

## 4. Alcance

- añadir comandos explícitos para `clear semantic cache`, `export health report`, `export support bundle`, `show memory budgets`, `show indexing state`, `show project routing`, `show sourceOrigin conflicts`, `rebuild workspace index` y `validate persistent cache`;
- clasificar el pack entre comandos read-only y confirmables;
- reutilizar `showStats`, dashboard, manifest, `currentObjectContext`, conflictos cross-project y `cacheStore` ya existentes;
- documentar el pack en `README.md` y `docs/developer-workflows.md`;
- alinear `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre y el movimiento del foco a `B279`.

## 5. Fuera de alcance

- abrir surfaces semánticas nuevas más allá de los wrappers/reportes del pack;
- introducir telemetría externa o un segundo motor de health/reporting;
- adelantar `B279` o `B280` dentro de esta spec.

## 6. Criterios de aceptación

- AC1. existen los nueve comandos del backlog como comandos explícitos del producto, con clasificación read-only o confirmable según riesgo.
- AC2. `export health report` exporta un artefacto offline reutilizando dashboard, stats y manifest reales del workspace.
- AC3. `show memory budgets`, `show indexing state`, `show project routing`, `show sourceOrigin conflicts` y `validate persistent cache` exponen reportes legibles sin abrir rails paralelos.
- AC4. `clear semantic cache` y `rebuild workspace index` quedan explícitamente confirmados antes de ejecutar la operación.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B279`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/coreMaintenanceCommandCatalog.test.js`
- `npm run test:smoke -- --grep "smoke/extension|smoke/health-report-extension"`

## 9. Cierre registrado

- el producto ya ofrece un pack explícito de mantenimiento sobre el backbone runtime/observability/cache existente;
- la smoke real valida el export offline del health report y el wiring read-only de los nuevos reportes;
- el siguiente foco canónico del repo pasa a `B279`.