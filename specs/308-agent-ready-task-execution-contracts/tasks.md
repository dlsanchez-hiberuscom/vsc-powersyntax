# Tasks - Spec 308 agent-ready task execution contracts (B263)

## 1. Preparación

- [x] T1. Confirmar que el dueño local del comportamiento es `src/shared/publicApi.ts` y el tool read-only `contract`, no un runner nuevo.
- [x] T2. Verificar que `applySpecDrivenPblUpdate*` y `generateSafeEditPlan` ya cubren el rail write-enabled y su dry-run real.

## 2. Implementación

- [x] T3. Publicar `taskExecutionCatalog` versionado dentro de `ApiPublicContractDescriptor`.
- [x] T4. Describir inputs/outputs, contexto máximo, validación requerida, límites write-enabled, receipts y handoff para los dos rails existentes.
- [x] T5. Añadir simulación declarativa de dry-run sin abrir un ejecutor paralelo.
- [x] T6. Alinear docs de orquestación/agentes/SDD y mover el foco canónico a `B264`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`.
- [x] T9. Ejecutar `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`.

## 4. Cierre

- [x] T10. Mover `B263` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B264` como foco siguiente.