# Spec 307 - safe code action framework v2 (B262)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B262` endureciendo el rail actual de code actions sobre diagnósticos reales, con catálogo versionado, preview explícita, preflight obligatorio y bloqueos defendibles antes de cualquier edición.

## 2. Estado real actual

La extensión ya publica `SD7` en el pipeline general de diagnostics y expone quick fixes seguras desde Problems/CodeAction mediante un catálogo `2.0.0` que declara `actionId`, `requiredConfidence`, `evidence`, `preview` y motivos de bloqueo por `sourceOrigin`, preflight o referencias dinámicas por string.

## 3. Objetivo

Convertir el quick fix base de `B036` en un framework v2 explicable y gobernado, reutilizando `diagnostic.code`, `sourceOrigin`, guards dinámicos y el rail LSP existente, sin abrir automatización write-enabled opaca.

## 4. Alcance

- evolucionar `provideCodeActions()` a un catálogo versionado con metadata explícita por acción;
- exigir preflight antes de habilitar un reemplazo sugerido por diagnóstico;
- bloquear acciones cuando el documento cae en `sourceOrigin` dudoso o hay referencias dinámicas por string del mismo identificador;
- integrar `SD7` en la publicación general de diagnostics para que Problems, métricas y code actions consuman la misma señal;
- validar con unit focalizadas y smoke real de Problems/CodeAction;
- alinear documentación viva y mover el foco canónico a `B263`.

## 5. Fuera de alcance

- inventar diagnósticos nuevos solo para alimentar quick fixes;
- abrir acciones multiarchivo, batch o automatización agent-ready dentro de este slice;
- relajar guards de `confidence`, `sourceOrigin` o dynamic strings para forzar que una acción aparezca.

## 6. Criterios de aceptación

- AC1. el provider LSP expone acciones versionadas con `catalogVersion`, `requiredConfidence`, `evidence` y `preview` explícita.
- AC2. el framework bloquea de forma explicable acciones con preflight inválido, `sourceOrigin` dudoso o referencias dinámicas por string.
- AC3. `SD7` se publica en el pipeline general de diagnostics y llega a Problems/CodeAction sin rutas paralelas.
- AC4. la validación cubre units del catálogo/guards y una smoke real editor -> Problems -> CodeAction.
- AC5. backlog, roadmap y current-focus dejan de tratar `B262` como deuda activa y pasan a `B263`.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/developer-workflows.md`
- `docs/rules-catalog.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeActions.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/obsolete.test.js`
- `npx vscode-test --label smoke --grep "expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction"`

## 9. Cierre registrado

- el producto ya publica `SD7` como diagnóstico real y lo reutiliza en Problems, explainability, métricas/reportes y code actions;
- el framework v2 de quick fixes queda versionado, con preview y bloqueos defendibles antes del edit;
- el siguiente foco canónico del repo pasa a `B263`.