# Quickstart - Spec 274 PBL library graph and directory discovery read-only (B190)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/watchedFileIntake.test.js
npm run test:smoke -- --grep "Object Explorer"
```