# Plan - Spec 308 agent-ready task execution contracts (B263)

## 1. Enfoque técnico

No crear un runner nuevo: injertar el catálogo de contratos en `ApiPublicContractDescriptor`, reutilizar el tool `contract` ya exportado y describir los rails write-enabled existentes (`applySpecDrivenPblUpdate*`) con su dry-run declarativo, límites y receipts. La orquestación IA debe leer ese contrato, no deducirlo de docs sueltas.

## 2. Pasos

1. Extender `publicApi.ts` con el catálogo versionado de task execution contracts.
2. Añadir simulación declarativa de dry-run sobre `generateSafeEditPlan`.
3. Validar compatibilidad con `supportBundle` y con el tool `contract` en el host real.
4. Alinear docs de orquestación/agentes/SDD y mover el foco canónico a `B264`.

## 3. Riesgos

- duplicar el contrato en docs sin exportarlo desde el producto;
- describir límites o receipts que el rail real no deja hoy;
- confundir contrato agent-ready con permiso para abrir nuevas writes fuera del carril ya cerrado.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 5. Resultado ejecutado

1. `taskExecutionCatalog` ya queda exportado dentro del descriptor contractual público.
2. El tool `contract` ya sirve esos contratos desde el host real de VS Code.
3. El foco canónico del repo pasa a `B264`.