# Tasks - Spec 311 query scope policy v2 (B266)

## 1. Preparación

- [x] T1. Confirmar los consumers reales del query engine y sus call sites en `server.ts`, `queryContext.ts`, `referenceSourcePool.ts` y features read-only relacionadas.
- [x] T2. Identificar el primer borde falsable: un consumer acotado a `project` seguía pudiendo caer a `workspace` por el fallback de `referenceSourcePool`.

## 2. Implementación

- [x] T3. Crear `queryScopePolicy.ts` con scope, budget, cap, readiness, confidence, fallback y allowances por consumer.
- [x] T4. Conectar `referenceSourcePool` para `references`/`rename`/`CodeLens` y evitar widening a `workspace` fuera de policy.
- [x] T5. Derivar `featureReadiness` del mismo contrato y meter `signatureHelp` en el gate común.
- [x] T6. Alinear los caps por defecto de `completion`, `currentObjectContext` e `impactAnalysis` con la policy central.
- [x] T7. Añadir la prueba negativa de report pesado sin routing de proyecto en `impactAnalysis.test.ts`.
- [x] T8. Alinear docs canónicas y mover el foco a `B267`.

## 3. Validación

- [x] T9. Ejecutar `npm run build:test`.
- [x] T10. Ejecutar `npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/featureReadiness.test.js`.
- [x] T11. Ejecutar `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeLensReferences.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js`.

## 4. Cierre

- [x] T12. Sacar `B266` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B267` y dejar la trazabilidad en `specs/311-query-scope-policy-v2`.