# Spec 271 - Current Object Context Panel (B215)

**Estado:** cerrada y validada.

## 1. Resumen

Abrir una vista `Current Object Context` read-only en el side bar, siguiendo el editor activo y reutilizando `currentObjectContext` ya expuesto por API pública/LSP en lugar de recomputar semántica localmente.

## 2. Estado real actual

`B215` queda `Closed`: el cliente registra la vista `powerbuilderCurrentObjectContext`, la refresca sobre cambios del editor activo y proyecta resumen, ancestros, variables visibles, members, diagnostics, bindings `DataObject`, references, related files y evidence/confidence sobre el contrato read-only ampliado con `visibleVariables`.

## 3. Objetivo

Permitir que el usuario entienda rápidamente dónde está y qué contexto semántico tiene el objeto activo desde una vista persistente, observable y segura.

## 4. Alcance

- ampliar `currentObjectContext` con `visibleVariables` sobre el backbone ya existente;
- construir un modelo puro del panel para secciones navegables y degradación honesta;
- registrar la vista `powerbuilderCurrentObjectContext` con comandos de foco/refresco y apertura segura de ubicaciones;
- validar con unit del contrato/modelo y smoke del comando visible sobre archivo activo.

## 5. Fuera de alcance

- abrir un segundo motor semántico local para calcular el panel;
- introducir edición o acciones mutantes desde la vista;
- mezclar este slice UX con ORCA legacy o staging fuera de su carril específico.

## 6. Criterios de aceptación

- AC1. Existe una vista `Current Object Context` visible en el side bar.
- AC2. La vista consume únicamente `currentObjectContext` y surfaces read-only ya cerradas.
- AC3. El panel expone object kind/name, proyecto/librería, ancestor chain, variables visibles, members, diagnostics, bindings `DataObject`, sourceOrigin y readiness/confidence.
- AC4. Los nodos permiten abrir ubicaciones seguras sin mutar el workspace.
- AC5. Hay validación unitaria del contrato ampliado y del modelo puro, más smoke del comando visible.
- AC6. El foco canónico se mueve a `B188`.

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
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "Current Object Context del archivo activo"`

## 9. Cierre registrado

- `src/shared/publicApi.ts` y `src/server/features/currentObjectContext.ts` aportan `visibleVariables` para locals/args y miembros heredados sin rehacer semántica en cliente;
- `src/client/currentObjectContextPanelModel.ts` y `src/client/currentObjectContextPanel.ts` componen y sirven la vista read-only;
- `src/client/extension.ts` y `package.json` registran la vista, menús y comandos visibles.