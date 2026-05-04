# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B371 — Catalog localization model and immutable overlay contract`

Estado actual: `B377` queda cerrada. El plugin ya publica un `object-check` read-only como tool bridge, método de API y comandos de producto para validar el objeto activo o uno resuelto por nombre, reutilizando `currentObjectContext`, `dependencyGraph`, `impactAnalysis` y `safeEditPlan` sin abrir un motor paralelo.

La evidencia vigente que deja `B377` es:

- `src/shared/publicApi.ts` publica `object-check`, `checkObject()`, `powerbuilder.checkCurrentObject` y los schemas `ApiObjectCheck*` como contrato estable de API pública v2;
- `src/client/objectCheckReport.ts` construye el reporte local del objeto con source resolution por editor/URI/nombre, findings AI-readable, truncado honesto y salida Markdown `# Object Check`;
- `src/client/extension.ts` compone `object-check` solo sobre surfaces read-only ya existentes, con fallback por editor activo, query por nombre cuando hace falta y comandos visibles `vscPowerSyntax.openCurrentObjectCheck` y `vscPowerSyntax.openObjectCheck`;
- `test/server/unit/objectCheckReport.test.ts` y `test/smoke/extension.test.ts` fijan workspace sano, diagnostics bloqueantes, dependencias ambiguas, bindings DataWindow no resueltos, SQL `EXECUTE` y el wiring end-to-end del tool/comando Markdown.

Con el chequeo global y el chequeo local ya resueltos, el siguiente cuello de botella vuelve a ser de gobernanza de catálogo y localización: toca retomar el carril `B371-B375` sobre una base de checks AI-readable ya cerrada.

---

## 2. Por qué es prioritario

Con `B377` cerrada, ya existe un chequeo local defendible del objeto activo; vuelve a ser prioritario cerrar la cadena de localización del catálogo sin reabrir checks base:

- `B371` debe fijar el modelo de localización del catálogo sobre el source-of-truth ya cerrado y sobre los nuevos carriles de validación read-only;
- la cadena de localización (`B371-B375`) ya no está bloqueada por governance del catálogo, pero sigue sin desplazar la necesidad inmediata de un workflow de validación consumible por IA;
- una vez fijados `workspace-check` y `object-check`, el mayor riesgo pasa a ser introducir localización y consumers sin contrato de overlays estable, migrable y medible.

---

## 3. Trabajo permitido ahora

- fijar el contrato de localización del catálogo y su estrategia de overlays sin duplicar información entre generated/manual/localized;
- mantener `workspace-check` y `object-check` como consumidores read-only estables durante el trabajo de localización;
- seguir priorizando cambios pequeños, verificables y compatibles con el runtime/LSP actual.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B367`, `B368` o `B369` salvo drift real del generador, de la policy de overlays o de la decision gate;
- reabrir `B376` o `B377` salvo drift real del contrato público, del wiring read-only o de la composición de sus reportes;
- mezclar `workspace check`, `object check` o localización con edición automática fuera de un dry-run explícito;
- abrir consumers localizados antes de fijar el contrato de overlays e IDs del carril `B371-B375`.

---

## 5. Criterios de salida del foco actual

- existe un contrato de localización del catálogo con overlays estables, medibles y compatibles con regeneración;
- los consumers posteriores pueden depender de ese contrato sin inventar IDs ni duplicar gobernanza;
- la salida es consumible por IA y por humanos sin perder trazabilidad;
- `testing`, `architecture`, `developer-workflows`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B372` — DocumentationService locale-aware lazy resolver.
2. `B373` — Localized catalog consumers for hover, completion and signatureHelp.
3. `B374` — Spanish catalog localization authoring workflow and coverage gate.

---

## 7. Regla final

`B371` debe aprovechar la base ya cerrada de catálogo y de checks read-only. No toca abrir otro rail: toca fijar overlays, IDs y reglas de localización que sostengan a los consumers posteriores sin drift.
