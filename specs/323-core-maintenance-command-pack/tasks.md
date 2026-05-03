# Tasks - Spec 323 core maintenance command pack (B278)

## 1. Preparación

- [x] T1. Identificar el slice mínimo de `B278` en cliente/servidor sin abrir un rail paralelo.
- [x] T2. Fijar un catálogo tipado para los nueve comandos y su clasificación read-only/confirmable.

## 2. Implementación

- [x] T3. Registrar los comandos cliente del pack y contribuirlos en `package.json`.
- [x] T4. Exponer `validatePersistentCache` y `clearSemanticCache` desde el servidor.
- [x] T5. Añadir reportes explícitos para health/memory/indexing/routing/sourceOrigin y rebuild/cache clear con confirmación.
- [x] T6. Integrar el pack en `openStatusMenu` sin duplicar el backbone de observabilidad existente.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/coreMaintenanceCommandCatalog.test.js`.
- [x] T9. Ejecutar `npm run test:smoke -- --grep "smoke/extension|smoke/health-report-extension"`.

## 4. Cierre

- [x] T10. Actualizar `README.md`, `docs/developer-workflows.md` y `docs/testing.md`.
- [x] T11. Sacar `B278` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B279` y dejar la trazabilidad en `specs/323-core-maintenance-command-pack`.