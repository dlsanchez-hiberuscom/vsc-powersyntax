# Quickstart - Spec 308 agent-ready task execution contracts (B263)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js
npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"
```

Comprobación funcional mínima:

1. Verificar que `getPublicContract()` devuelve `taskExecutionCatalog` con los contratos `spec-driven-pbl-update` y `spec-driven-pbl-update-batch`.
2. Verificar que `invokeReadOnlyTool({ tool: "contract" })` devuelve `ApiPublicContractDescriptor` con ese mismo catálogo desde el host real.
3. Verificar en unit que el catálogo declara dry-run, límites write-enabled y receipts para ambos rails sin crear un método de ejecución nuevo.