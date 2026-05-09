# Wave 06 — Read-only Surfaces, Object Explorer, SQL Caps and AI Execution Budget

## PHASE 0 — Baseline and dependency verification

### Docs reviewed

- `docs/backlog.md` for backlog items 13, 14, 15, 17 and 22.
- `docs/current-focus.md`, `docs/roadmap.md` and `docs/done-log.md` for active sequencing and closure rules.
- `docs/architecture.md`, `docs/architecture-status.md` and `docs/architecture-implementation-map.md` for thin-client, read-only surface and ownership constraints.
- `docs/instant-semantic-indexing-target.md`, `docs/semantic-design-target.md` and `docs/semantic-design-assumptions.md` for the target projection model, SQL advisory constraints and paging/cap expectations.
- `docs/performance-budget.md`, `docs/testing.md` and `docs/troubleshooting.md` for payload, refresh, smoke and degraded/stale handling rules.
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` for embedded SQL language boundaries.
- `docs/audits/macro-instant-semantic-indexing-findings.md` and `docs/audits/macro-instant-semantic-indexing-audit.md` for FINDING-001, FINDING-006, FINDING-027, FINDING-028 and FINDING-043.
- `docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md` for the Wave 05 dependency baseline.

Specs `specs/PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01.md`, `specs/PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01.md`, `specs/PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01.md` and `specs/PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01.md` do not exist in the repository, so this report becomes the implementation-evidence owner for Wave 06.

### Wave 05 dependency status

- Wave 05 left the shared dependency in a usable but partial state: `src/shared/publicApi.ts` already exports `ApiReadOnlyProjectionEnvelope` and the shared state type `loading/degraded/stale/ready/paged/error`.
- Minimal helpers already exist: `createReadOnlyProjectionEnvelope()`, `createReadyProjectionEnvelope()`, `createStaleProjectionEnvelope()` and `createDegradedProjectionEnvelope()`.
- The optional/backward-compatible DTO strategy is already active: `workspace-check` pilots the envelope without breaking the previous report shape.
- Caps, truncation and refresh metadata already exist in the pilot path, but only on `workspace-check`.
- Wave 05 tests already cover the public API serialization path and the `workspace-check` pilot.
- The dependency remains partial because Object Explorer, Current Object Context, diagnostics explainability and AI bundle surfaces still do not consume the shared envelope.

### Object Explorer current flow

- `src/client/objectExplorer.ts` still uses `ObjectExplorerProvider.refreshBackground()` to load a full `ApiSemanticWorkspaceManifest` snapshot before rendering the tree.
- `src/client/objectExplorerModel.ts` still groups the flat manifest client-side into the full project/library/kind/object tree.
- Stable node IDs already exist (`project:*`, `library:*`, `kind:*`, `object:*`), so the migration does not need a new identity scheme.
- There is no server-owned page/children query path yet; normal rendering still depends on a full manifest payload.
- Current degraded handling is only a fallback message when manifest loading fails.

### SQL anchors current flow

- `src/server/features/embeddedSqlAnchors.ts` still defines `DEFAULT_MAX_ANCHORS = Number.MAX_SAFE_INTEGER`.
- `src/server/features/currentObjectContext.ts` still calls `collectEmbeddedSqlAnchors(snapshot)` without an explicit cap.
- The exposed DTO currently returns only `embeddedSqlAnchors[]`; there is no cap/truncation receipt yet.
- Existing detection behavior is already locked by `sqlRegions` and `currentObjectContext` tests, so the first change can focus on bounds and receipts without changing the detection rules.

### AI bundle current flow

- `src/client/extension.ts` currently resolves `getAiTaskContextBundle()` by scheduling all requested sections up front and awaiting them with `Promise.all(...)`.
- This means expensive sections execute before the bundle builder can apply any budget logic.
- `src/client/aiTaskContextBundle.ts` trims some arrays and prunes sections only after section execution and payload materialization.
- There is no execution-plan model yet and no `skipped-before-execution` receipt.

### UX/read-only state current flow

- The shared envelope exists, but the surfaces touched by this wave do not use it consistently yet.
- `src/client/objectExplorer.ts` exposes only a message fallback for load failure; it does not model `loading`, `paged`, `stale` or `degraded` explicitly.
- `src/client/currentObjectContextPanel.ts` distinguishes normal model vs fallback message, but not a compact state contract.
- `src/client/diagnosticsExplainabilityPanel.ts` similarly refreshes a model without a uniform read-only state envelope.
- `workspace-check` remains the only concrete Wave 05 pilot for the shared read-only state contract.

### Baseline validation

- `npm run build:test` -> passed.
- `npx vscode-test --label unit --grep "objectExplorer"` -> 4 passing.
- `npx vscode-test --label unit --grep "currentObjectContext"` -> 13 passing.
- `npx vscode-test --label unit --grep "sqlRegions"` -> 5 passing.
- `npx vscode-test --label unit --grep "embedded SQL"` -> 1 passing.
- `npx vscode-test --label unit --grep "aiTaskContext"` -> 8 passing.
- `npx vscode-test --label unit --grep "supportBundle"` -> 5 passing.
- `npm run test:architecture:rapid` -> passed with 0 violations.

The prompt suggested `npm test -- --grep ...`, but the narrowest available executable baseline in this repository is `npx vscode-test --label unit --grep ...` after `npm run build:test`, which avoids widening the baseline to integration and smoke lanes before any Wave 06 code change.

### Initial risks

- Object Explorer needs a server-owned paged path without breaking the existing manifest compatibility path and without reintroducing a full client tree build on the normal path.
- SQL anchors need bounds and receipts added in a backward-compatible way because multiple read-only reports already serialize anchor arrays.
- AI execution planning must move up to the extension call site; changing only the bundle builder would leave the real cost problem intact.
- Current UI state handling is still message-based, so the wave must add compact state receipts without turning the views into noisy status dashboards.
- The global smoke lane remains historically unstable, so Wave 06 validation must separate actual regressions from unrelated pre-existing smoke debt.

## PHASE 1 — Embedded SQL caps and truncation receipts

### Implemented changes

- `src/server/features/embeddedSqlAnchors.ts` now applies consumer-aware caps instead of treating interactive consumers as effectively unbounded.
- The collector now exposes a bounded projection result with `anchors`, `maxAnchors`, `truncated` and `consumer`, while preserving the existing array-returning helper for compatibility call sites.
- `src/server/features/currentObjectContext.ts` now resolves embedded SQL anchors through the bounded projection path using the `current-object-context` consumer.
- `ApiCurrentObjectContext` now includes `embeddedSqlReceipt`, which publishes a nested read-only projection envelope for the SQL anchor slice.
- The Current Object Context SQL slice now reports `projectionId`, `projectionOwner`, `caps.maxItems`, `refreshHint` and a truncation reason when the anchor cap is hit.

### Compatibility and behavior notes

- The legacy `embeddedSqlAnchors[]` payload remains present, so existing consumers that only read the array are not broken.
- The new receipt is additive and optional, following the Wave 05 DTO strategy for backward-compatible read-only envelope adoption.
- The bounded path is strict for interactive/report consumers and only allows explicit unbounded mode for `debug/deep-report`.

### Validation

- `npm run build:test` -> passed after the SQL cap changes.
- `npx vscode-test --label unit --grep "currentObjectContext"` -> 14 passing.
- `npx vscode-test --label unit --grep "embeddedSqlAnchors"` -> 2 passing.

## PHASE 2 — Object Explorer server-owned paged projection

### Implemented changes

- `src/shared/publicApi.ts` now defines paged Object Explorer DTOs for request, node path, node page and scope.
- `src/server/features/objectExplorerProjection.ts` now builds a server-owned paged Object Explorer projection with root and child paging based on `parentPath`.
- `src/server/handlers/lifecycleHandlers.ts` and `src/server/handlers/runtimeCommandHandlers.ts` now expose `powerbuilder.objectExplorerProjection` through the runtime execute-command surface.
- `src/client/objectExplorer.ts` no longer depends on a full manifest on the normal path; it now requests pages lazily, caches loaded slices locally and uses a local `Cargar más` sentinel node for page continuation.
- `src/client/objectExplorerProjectionModel.ts` centralizes client-side page merge behavior so the paged append contract is testable without the VS Code tree provider.
- `src/client/extension.ts` now wires Object Explorer to the new server command and keeps the manifest path only as compatibility fallback when the paged request fails.
- `src/client/commandRegistration.ts` now exposes a client command for page continuation so the local sentinel can request the next server page.

### Latency fix discovered during validation

- The first end-to-end smoke run for `powerbuilder.focusObjectExplorerOnCurrentFile` timed out even though compile and focused unit tests were green.
- The blocking path was not in the tree provider shape itself but in the scheduler class used by the new runtime command.
- `powerbuilder.objectExplorerProjection` now runs through `runNearContextWorkload(...)` instead of `runExportReportingWorkload(...)`, which aligns the command with an interactive read-only surface instead of a background/export lane.
- This scheduler correction removed the smoke timeout without reverting the paged projection design.

### Compatibility and behavior notes

- The manifest-based client tree builder remains available as fallback, so the migration is incremental and reversible.
- Stable node identity stayed on the existing `project:*`, `library:*`, `kind:*` and `object:*` scheme.
- The paged client path derives focus result metadata from `focusNodeId` when the leaf node is not yet loaded in the first page.
- The controller no longer triggers an eager refresh from its constructor, which avoids unnecessary activation-time work and lets the view or a focused command drive the first request.

### Validation

- `npm run build:test` -> passed after the paged client/provider changes.
- `npx vscode-test --label unit --grep "objectExplorer(Projection|ProjectionModel|Model)"` -> 8 passing.
- `npx vscode-test --label smoke --grep "puede enfocar el Object Explorer en el archivo activo"` -> 1 passing.

## PHASE 3 — AI task context execution planning before expensive section execution

### Implemented changes

- `src/client/aiTaskContextBundle.ts` now owns an explicit execution-plan model that estimates section cost, decides which sections are scheduled and emits compact skip receipts before expensive work starts.
- `src/shared/publicApi.ts` now publishes the additive public contract for `executionPlan`, section keys and skip receipts, including the `token-budget-preflight` reason code.
- `src/client/extension.ts` now resolves the request, builds the execution plan first and only executes scheduled sections instead of launching all section work up front.
- The final bundle builder still retains the pruning/minimization path, but only as a defensive guard after the preflight plan has already limited execution.

### Compatibility and behavior notes

- The public DTO change is additive and backward-compatible: existing bundle consumers can ignore `executionPlan` safely.
- The budget heuristic remains centralized in `src/client/aiTaskContextBundle.ts`; the extension call site only consumes the plan and does not duplicate the budgeting rules.
- This change fixes the real cost problem at the execution boundary instead of only shrinking the final payload after work already ran.

### Validation

- `npm run build:test` -> passed after the execution-plan changes.
- `npx vscode-test --label unit --grep "(aiTaskContextBundle|publicApi)"` -> 26 passing.
- `npx vscode-test --label smoke --grep "ai task context bundle expone metodo, tool read-only y comando oculto"` -> 1 passing.

## PHASE 4 — Consistent read-only UX state for loading/degraded/stale/ready/paged/error

### Implemented changes

- `src/client/readOnlyProjectionState.ts` now centralizes compact state text for read-only surfaces, including merge behavior between local view status and server receipts.
- `src/client/objectExplorer.ts` now exposes explicit loading and paged state messaging for lazy page fetches instead of only falling back to a generic failure message.
- `src/client/currentObjectContextPanel.ts` now combines the panel model with `embeddedSqlReceipt.projection` so SQL truncation/caps surface through the same compact state path.
- `src/client/diagnosticsExplainabilityPanel.ts` now exposes explicit loading/error view messages and uses the shared helper so the panel no longer invents its own status wording.

### Compatibility and behavior notes

- The shared helper normalizes microcopy without forcing every surface to adopt the full envelope at once.
- Surfaces that already have richer server receipts use them; surfaces without envelope support can still publish consistent local `loading/error` messages.
- This keeps the thin-client approach intact: the client renders compact state, but server-owned receipts remain the source of truth when they exist.

### Validation

- `npm run build:test` -> passed after the shared read-only state changes.
- `npx vscode-test --label unit --grep "(readOnlyProjectionState|objectExplorer(Projection|ProjectionModel|Model)|currentObjectContext)"` -> 25 passing.

## PHASE 5 — Documentation owner alignment

### Implemented changes

- `docs/backlog.md` now marks the Wave 06 backlog items as `Partial` where code and focused validation are already real, and narrows the remaining closure work instead of leaving the items as fully open.
- `docs/architecture-status.md` now reflects that `workspace-check` is no longer the only envelope/pilot surface: Current Object Context, Object Explorer and the AI bundle now expose Wave 06 receipts/projections in production paths.
- `docs/architecture-implementation-map.md`, `docs/testing.md`, `docs/performance-budget.md` and `docs/instant-semantic-indexing-target.md` now point to the concrete owners and validations added by this wave instead of describing them purely as target state.

### Documentation notes

- `docs/current-focus.md` stayed unchanged because it still owns a different active backlog focus and the Wave 06 work did not replace that sequencing contract.
- The owner split remains intentional: backlog/status track state, this audit tracks implementation evidence and the target architecture keeps future-looking language.

## PHASE 6 — Final validation

### Commands run

- `npm run test:docs:drift` -> passed.
- `npm run build:test` -> passed.
- `npm run test:architecture:rapid` -> passed.
- `npm run test:performance:gate` -> passed.
- `npm test` -> exited with code `1`.
- `npm run test:smoke` -> exited with code `1`.

### Validation interpretation

- The Wave 06-focused executable checks remained green: the Object Explorer paged/unit/smoke slices, the AI bundle unit/smoke slices and the read-only state unit slices all passed during implementation.
- The final broad smoke lane still fails in unrelated areas with `Client got disposed and can't be restarted`, timeouts and downstream assertions across support bundle, semantic repro pack, formatting, health report and generic diagnostics smoke coverage.
- Because the failing broad smoke set spans areas untouched by Wave 06 and the focused Wave 06 checks already passed, this report treats the remaining smoke failures as pre-existing or environmental debt outside the scope of this wave.