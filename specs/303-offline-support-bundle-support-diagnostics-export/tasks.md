# Tasks - Spec 303 offline support bundle / support diagnostics export (B258)

## 1. Preparación

- [x] T1. Confirmar que `serverStats`, `semanticWorkspaceManifest`, `getPublicContract()`, `getReadOnlyToolBridge()` y la gobernanza de settings ya publican suficiente contexto para un bundle defendible.
- [x] T2. Identificar el repro pack semántico existente como abstraction cercana a reutilizar sin mezclar source capture por defecto.

## 2. Implementación

- [x] T3. Implementar el builder `supportBundle` cliente-side con redacción explícita.
- [x] T4. Exponer el comando `PowerSyntax: Exportar Support Bundle Offline` y su wiring en la extensión.
- [x] T5. Exportar inventario API/tool, runtime journal tail, diagnostics saneada, settings saneados y snapshot build/ORCA sin código bruto por defecto.
- [x] T6. Alinear README, workflows, testing y documentos canónicos de foco/cierre.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`.
- [x] T9. Ejecutar `npm run test:smoke -- --grep "support-bundle-extension"`.

## 4. Cierre

- [x] T10. Mover `B258` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B259` como foco siguiente.