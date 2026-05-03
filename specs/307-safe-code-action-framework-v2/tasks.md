# Tasks - Spec 307 safe code action framework v2 (B262)

## 1. Preparación

- [x] T1. Confirmar que el dueño local del comportamiento es `src/server/features/codeActions.ts` y no un rail nuevo.
- [x] T2. Verificar que `renamePreflight`, `dynamicStringReferences` y `sourceOrigin` ya existen como guards reutilizables.

## 2. Implementación

- [x] T3. Convertir el provider existente en un catálogo versionado con `actionId`, `requiredConfidence`, `evidence` y `preview`.
- [x] T4. Hacer obligatorio el preflight antes de habilitar el reemplazo sugerido.
- [x] T5. Bloquear acciones por `sourceOrigin` dudoso y por referencias dinámicas por string del mismo identificador.
- [x] T6. Integrar `SD7` en el pipeline general de diagnostics para que Problems y CodeAction compartan la misma señal.
- [x] T7. Alinear documentación viva y mover el foco canónico a `B263`.

## 3. Validación

- [x] T8. Ejecutar `npm run build:test`.
- [x] T9. Ejecutar `npx mocha --ui tdd out/test/server/unit/codeActions.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/obsolete.test.js`.
- [x] T10. Ejecutar `npx vscode-test --label smoke --grep "expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction"`.

## 4. Cierre

- [x] T11. Mover `B262` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B263` como foco siguiente.