# Quickstart — Spec 363 Workspace support matrix finalization

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/projectSupportMatrix.test.js out/test/server/unit/projectHealthDashboard.test.js
npm run test:smoke
```

## Expected result

The pure client-side support matrix remains aligned with the exported health report, the smoke export keeps surfacing that matrix, and the product contract stays explicit for `Workspace`, `Solution`, `.pbt`, `pbl-only`, source plain-text/exported source, ORCA staging, `.srd`, `PBAutoBuild` and PowerServer/PowerClient build files without reopening server-side topology logic.