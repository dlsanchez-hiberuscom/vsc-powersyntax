# Plan - Spec 323 core maintenance command pack (B278)

## 1. Enfoque técnico

Partir del borde más directo donde se controla el pack: `src/client/extension.ts` y `package.json` ya concentraban casi todo el wiring de comandos, mientras `src/server/server.ts` solo necesitaba dos comandos nuevos para persistencia. La estrategia fue evitar un rail nuevo y montar wrappers finos sobre surfaces ya publicadas, fijando antes un catálogo tipado del pack para poder validarlo con una unidad propia.

## 2. Pasos

1. Crear un catálogo tipado con los nueve comandos de `B278` y su clasificación read-only/confirmable.
2. Registrar los comandos cliente y exponerlos en `package.json` y en el menú de estado.
3. Añadir los dos comandos servidor mínimos para validar y limpiar la caché persistente.
4. Añadir smoke real para el export del health report y la ejecución read-only de los nuevos reportes.
5. Alinear docs canónicas y mover el foco a `B279`.

## 3. Riesgos

- duplicar observabilidad que ya estaba resuelta por `showStats`, dashboard o support bundle;
- mezclar mantenimiento del core con nuevas surfaces semánticas fuera de foco;
- dejar comandos peligrosos sin confirmación explícita;
- cerrar `B278` con nombres de comando sin smoke real ni modelo tipado verificable.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/coreMaintenanceCommandCatalog.test.js`
- `npm run test:smoke -- --grep "smoke/extension|smoke/health-report-extension"`

## 5. Resultado ejecutado

1. el catálogo `coreMaintenanceCommandCatalog` fija los nueve comandos y su nivel de riesgo;
2. el cliente expone el pack completo desde Command Palette y desde el menú de estado, reusando dashboard/stats/manifest/current object context/conflicts/cacheStore;
3. el foco canónico del repo queda ya movido a `B279`.