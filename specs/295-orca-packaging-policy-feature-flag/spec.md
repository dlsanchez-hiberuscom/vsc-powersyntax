# Spec 295 - ORCA packaging policy behind feature flag (B195)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B195` sin abrir un motor nuevo de packaging legacy: el producto declara explícitamente que la creación de `EXE/PBD/DLL` vía ORCA no está expuesta, requeriría un feature flag dedicado y queda fuera del carril moderno de `PBAutoBuild`.

## 2. Estado real actual

La capability ORCA del cliente ya expone `packagingPolicy` como señal read-only reutilizable para status, dashboard, stats y soporte. No se abren comandos nuevos ni settings nuevos para packaging legacy, y la decisión queda documentada en la documentación viva del producto.

## 3. Objetivo

Resolver la duda de alcance de `B195` con una policy explícita, visible y compatible con la arquitectura actual.

## 4. Alcance

- publicar una policy read-only sobre packaging ORCA en la capability snapshot;
- proyectarla en status/stats/dashboard;
- alinear documentación viva y artefactos canónicos con la decisión;
- mover el foco canónico al siguiente bloque `B251-B263`.

## 5. Fuera de alcance

- abrir comandos ORCA para crear `EXE/PBD/DLL`;
- añadir feature flag real o carril write-enabled nuevo para packaging;
- mezclar packaging legacy con `PBAutoBuild`.

## 6. Criterios de aceptación

- AC1. `orcaTooling.packagingPolicy` declara `exposure: not-exposed` y `requiresFeatureFlag: true`.
- AC2. status/stats/dashboard proyectan esa policy sin reabrir surfaces write-enabled nuevas.
- AC3. la documentación viva deja trazado que el packaging ORCA no está expuesto.
- AC4. backlog, roadmap y current-focus ya no tratan `B195` como deuda activa.
- AC5. el siguiente foco canónico pasa a `B251`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- el producto deja explícito que el packaging ORCA requeriría un feature flag dedicado y no forma parte de la surface actual;
- soporte y mantenimiento pueden ver esa decisión desde las mismas surfaces read-only ya existentes;
- el backlog operativo pasa al bloque `B251-B263`.
