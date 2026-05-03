# Quickstart - Spec 296 semantic snapshot diff workspace states (B251)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js
npm run test:smoke -- --grep "la extensión se activa"
```

Comprobación funcional mínima:

1. Verificar que `api.diffSemanticWorkspaceSnapshots()` devuelve `changed === true` cuando el snapshot candidato añade objetos o símbolos.
2. Verificar que `invokeReadOnlyTool({ tool: "semantic-snapshot-diff" })` responde con schema `ApiSemanticWorkspaceSnapshotDiff`.
3. Verificar que backlog/current-focus/roadmap/done-log ya no tratan `B251` como deuda activa.
