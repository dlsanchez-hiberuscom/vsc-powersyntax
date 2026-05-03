# Spec 363: Workspace support matrix finalization

## Status

Closed.

## Backlog mapping

- B293 — Workspace support matrix finalization.

## Objective

Turn the product's effective workspace support contract into one explicit, auditable matrix that is visible in the exported health report and aligned in canonical docs, without opening a second topology/semantics source outside the existing client-side stats + manifest rail.

## Implemented scope

- `projectSupportMatrix.ts` derives a pure support matrix from `RuntimeStatusStats` and `ApiSemanticWorkspaceManifest`, covering `Workspace`, `Solution`, target `.pbt`, `pbl-only`, source plain-text/exported source, ORCA staging, `DataWindow .srd`, `PBAutoBuild` and PowerServer/PowerClient build files.
- `projectHealthDashboard.ts` projects that matrix into the exported health report so the visible runtime artifact carries the same support/limitations contract as the docs.
- `projectSupportMatrix.test.ts`, `projectHealthDashboard.test.ts` and `health-report.extension.test.ts` lock the matrix semantics, markdown projection and real export path.
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md` and `docs/testing.md` now align the support contract with the visible health report and the real client-side derivation path.

## Out of scope

- Adding new discovery/topology/build capabilities in server or runtime.
- Reopening PBAutoBuild, ORCA or DataWindow semantics beyond the support claims already backed by existing code and tests.
- Enterprise health scoring (`B296`) or a runtime self-test command (`B297`).

## Acceptance evidence

- The support matrix covers the nine backlog-required modes/surfaces with explicit limitations.
- The exported health report contains the matrix and stays consistent with the pure client-side model.
- Canonical docs publish the same contract without inventing unsupported modes or hiding degradation rules.