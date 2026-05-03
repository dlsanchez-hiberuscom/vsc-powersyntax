# Plan - Spec 307 safe code action framework v2 (B262)

## 1. Enfoque técnico

Reutilizar el provider LSP existente de code actions y endurecerlo en el mismo rail: un catálogo versionado por acción, metadata explícita, preflight con `renamePreflight`, bloqueo por `sourceOrigin` y guard de dynamic strings, y publicación real de `SD7` en diagnostics para que Problems y CodeAction compartan la misma evidencia.

## 2. Pasos

1. Endurecer `provideCodeActions()` con catálogo versionado, preview y bloqueos explícitos.
2. Propagar `sourceOrigin` contextual desde `server.ts` al provider.
3. Integrar `findObsoleteCalls()` en el pipeline general de diagnostics.
4. Validar catálogo/guards con units focalizadas y smoke real de Problems/CodeAction.
5. Alinear documentación viva y mover el foco canónico a `B263`.

## 3. Riesgos

- dejar quick fixes activas sin una señal diagnóstica realmente publicada en Problems;
- mostrar acciones aparentemente seguras sobre `sourceOrigin` dudoso o referencias dinámicas por string;
- convertir el framework de quick fixes en una puerta trasera de automatización write-enabled sin contrato ni explainability.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeActions.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/obsolete.test.js`
- `npx vscode-test --label smoke --grep "expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction"`

## 5. Resultado ejecutado

1. El provider actual ya sirve un catálogo `2.0.0` con preview, evidence y bloqueo explícito por preflight/`sourceOrigin`/dynamic strings.
2. `SD7` ya sale por el pipeline general de diagnostics y llega a Problems/CodeAction.
3. El foco canónico del repo pasa a `B263`.