# Technical Debt Inventory

## Owner

This document owns post-block technical debt decisions. It is not a task dump: each entry records category, status, owner surface, decision and next validation. Active work still lives in [docs/backlog.md](backlog.md), closed work in [docs/done-log.md](done-log.md), and current execution focus in [docs/current-focus.md](current-focus.md).

## Statuses

- `Active`: currently in the promoted block or needs immediate handling.
- `Backlog`: known debt with a future spec or grouped cleanup path.
- `Superseded`: replaced by a newer owner/spec.
- `Deprecated`: kept temporarily with a retirement plan.
- `Blocked`: waiting for external decision or environment.
- `Reference-only`: intentionally kept as evidence, fixture or historical source.
- `Remove candidate`: may be deleted only with a removal receipt.

## Inventory

| Category | Item | Status | Owner surface | Decision | Next validation |
| --- | --- | --- | --- | --- | --- |
| legacy | `plugin_old` source tree | Reference-only | [docs/legacy-isolation.md](legacy-isolation.md) | Keep as historical evidence and fixture source; never runtime | `npm run test:architecture:rapid` |
| legacy | Heuristic extraction from `plugin_old` | Backlog | [docs/legacy-isolation.md](legacy-isolation.md) | Extract only with evidence, modern owner, tests and docs | focused unit tests + docs drift |
| architecture | Runtime imports into `plugin_old` | Active | [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) | Guard static/dynamic imports and require patterns | `npm run test:unit -- --grep "unit/architectureImports"` |
| docs | Source-of-truth ownership | Active | [docs/architecture-status.md](architecture-status.md) | Keep owners linked instead of duplicating long procedures | `npm run test:docs:drift` |
| AI | Prompt naming and AI customization cleanup | Done | [docs/ai-orchestration.md](ai-orchestration.md) | Bloque 10 locked `.prompt.md`, agents, skills and contracts | `npm run test:docs:drift` |
| build/release | Release lane and VSIX docs | Done | [docs/release.md](release.md) | Bloque 11 locked release readiness, installed smoke and artifact policy | `npm run release:verify` |
| config | Missing `lint` script | Backlog | [docs/testing.md](testing.md) | Do not document lint as required until the script exists | docs drift + package script review |
| testing | Optional real corpora lane | Backlog | [docs/testing.md](testing.md) | Keep opt-in; do not require private fixtures in CI | performance/smoke gated suites |
| code | Unused exports/orphan modules | Backlog | [docs/architecture-implementation-map.md](architecture-implementation-map.md) | Audit in focused slices; no removals without consumers proof | compile + focused unit tests |
| release | Pre-release cleanup receipts | Active | [docs/release.md](release.md) | Removals need receipt, validation and rollback note | `npm run release:verify` |

## Cleanup Receipts

Any removal of code, docs, prompts, agents, skills, fixtures or scripts must record:

- removed path;
- reason;
- replacement or owner;
- tests run;
- rollback path;
- docs touched.

No removal was performed by Bloque 12 unless it has an explicit receipt in [docs/done-log.md](done-log.md).
