# Quickstart - Spec 301 workspace migration assistant (B256)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/publicApi.test.js --grep "(B256|workspaceMigrationAssistant|workspace-migration-assistant|versión exportada|descriptor contractual|bridge read-only)"
npm run test:smoke -- --grep "la extensión se activa"
```

Comprobación funcional mínima:

1. Verificar que el asistente propone una migración guiada para layouts `pbl-only` y prioriza consolidar `mixed mode` y build files ambiguos.
2. Verificar que `getWorkspaceMigrationAssistant()` y el tool `workspace-migration-assistant` exponen el schema `ApiWorkspaceMigrationAssistant` con degradación explícita cuando discovery todavía no tiene contexto suficiente.
3. Verificar que `PowerSyntax: Abrir Asistente de Migración de Workspace` abre un Markdown lateral y que backlog/current-focus/roadmap/done-log ya no tratan `B256` como deuda activa.