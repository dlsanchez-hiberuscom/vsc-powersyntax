# Spec 378: Client command registration and lazy view activation

## Status

Closed.

## Backlog mapping

- B346 — Refactor client extension activation and command registration.

## Objective

Reducir la responsabilidad de `src/client/extension.ts` separando el wiring de comandos cliente y sacando del hot path de `activate()` superficies de UI que no deben materializarse antes de tiempo, sin tocar command IDs, API pública ni el contrato thin-client del producto.

## Implemented scope

- `src/client/commandRegistration.ts` concentra el registro de comandos por dominios (`core`, panels, reports, status, build/ORCA y support/maintenance) y deja `src/client/extension.ts` como host de lifecycle, handlers y bridge ligero.
- Los handlers inline de jerarquía, Current Object Context, Diagnostics Explainability y Object Explorer pasan a helpers nombrados reutilizables, manteniendo intactos IDs y mensajes visibles.
- `PowerBuilderObjectExplorerController`, `CurrentObjectContextPanelController` y `DiagnosticsExplainabilityPanelController` dejan de instanciarse durante `activate()` y pasan a materializarse bajo demanda mediante `ensure*Controller()`, evitando `createTreeView(...)` eager en el cold start.
- La API pública exportada se mantiene estable, pero su materialización real deja de pagarse de forma eager en el module load del cliente.

## Out of scope

- Añadir métricas/thresholds ejecutables de tamaño y responsabilidad para hotspots (`B353`).
- Convertir PFC Workspace/Solution y STD/OrderEntry en gate rápido reproducible para refactors (`B356`).
- Descomponer `src/server/server.ts` o mover runtime policies fuera del servidor (`B347/B354`).

## Acceptance evidence

- Los command IDs existentes siguen registrados y los comandos principales del cliente mantienen su wiring observable.
- El firewall `client -> server` sigue verde tras extraer el registro a un módulo dedicado.
- La smoke focal de activación vuelve a pasar bajo el assert duro `< 2000ms` con el host de pruebas del repo.
- Object Explorer, Current Object Context, dashboard de salud, restartServer, PBAutoBuild, ORCA legacy, runtime self-test y settings governance siguen funcionando desde el host real de VS Code.

## Validation

```bash
npm run compile
npm run test:unit -- --grep architectureImports
npm run test:smoke -- --grep "la extensión se activa en menos de 500ms"
npx vscode-test --label smoke --grep 'runtime self-test|settings governance|restartServer|PBAutoBuild|ORCA legacy|dashboard de salud|Object Explorer|Current Object Context'
```