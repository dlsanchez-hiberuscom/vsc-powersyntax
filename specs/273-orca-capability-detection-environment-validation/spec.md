# Spec 273 - ORCA capability detection and environment validation (B189)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar la capability read-only de ORCA legacy sin tocar el runner base ni abrir autodetección difusa: el cliente resuelve disponibilidad desde configuración explícita o `PB_ORCA_PATH`, valida el entorno y publica un snapshot reutilizable para comandos, status y dashboard.

## 2. Estado real actual

`B189` queda `Closed`: `src/client/build/orcaDetection.ts` detecta capability ORCA en Windows desde `vscPowerSyntax.legacy.orcaPath` y `PB_ORCA_PATH`, `src/client/extension.ts` usa ese snapshot para ejecutar el script activo y `src/shared/publicApi.ts`/surfaces read-only publican `orcaTooling` para stats, tooltip, menú de estado, dashboard y smoke.

## 3. Objetivo

Hacer explícito cuándo ORCA legacy está disponible, cuándo el entorno es inválido y cómo degradar sin romper el plugin ni reintroducir heurísticas difusas fuera del carril legacy.

## 4. Alcance

- crear un detector cliente-side cacheado con entradas limitadas a configuración explícita y `PB_ORCA_PATH`;
- validar plataforma Windows y distinguir ruta ausente frente a directorio inválido;
- exponer `orcaTooling` en el contrato público visible para status/dashboard/UX ligera;
- hacer que `runActiveOrcaScript` consuma el snapshot de capability en lugar de leer la configuración en crudo;
- validar con unit del detector y de las proyecciones visibles, más smoke del comando ORCA.

## 5. Fuera de alcance

- autodetección por rutas instaladas, registry o heurísticas difusas;
- imponer validación rígida por basename/versionado del binario sin corpus/documentación canónica suficiente;
- discovery de PBL, export/import ORCA o staging legacy (`B190+`).

## 6. Criterios de aceptación

- AC1. Existe un snapshot `orcaTooling` reusable y visible desde la API/stats del cliente.
- AC2. El comando ORCA usa ese snapshot y degrada con mensaje honesto cuando ORCA no está disponible.
- AC3. Status bar, reports y dashboard muestran capability ORCA y último runner sin inventar estado.
- AC4. Las fuentes de detección quedan limitadas a configuración explícita y `PB_ORCA_PATH`.
- AC5. Hay validación unitaria del detector y de la UX visible, más smoke del flujo ORCA real.
- AC6. El foco canónico se mueve a `B190`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy"`

## 9. Cierre registrado

- `src/client/build/orcaDetection.ts` formaliza la capability read-only ORCA con caché TTL y degradación honesta;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `src/client/projectHealthDashboard.ts` proyectan `orcaTooling` en comandos, status, menú y dashboard sin tocar el servidor;
- `test/server/unit/orcaDetection.test.ts`, `test/server/unit/statusBarPresentation.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal fijan el comportamiento visible.