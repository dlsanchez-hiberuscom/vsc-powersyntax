# Troubleshooting

## Owner

This document owns operational failure interpretation for release, PBAutoBuild, ORCA and external command rails. It complements [docs/release.md](release.md), [docs/developer-workflows.md](developer-workflows.md), [docs/architecture-status.md](architecture-status.md) and [docs/testing.md](testing.md).

## General Rules

- External tools are optional and must run only through explicit commands, tasks, reports or release lanes.
- Missing PowerBuilder IDE, PBAutoBuild or ORCA must not degrade normal language features.
- Do not run external commands from startup, file open, hover, completion, signature help, definition or diagnostics hot paths.
- Use configured paths or documented environment variables; do not hardcode local installation paths.
- Redact tokens, passwords, PATs, source-control credentials and sensitive paths before showing logs or adding support bundle data.
- Respect Workspace Trust and Restricted Mode before running external commands.

## Release And VSIX

| Symptom | Check first | Likely reason code | Action |
| --- | --- | --- | --- |
| `release:verify` fails before package | `npm test` output | `test-failed` | Fix the failing suite before packaging. |
| Architecture rapid fails | `artifacts/performance/architecture-rapid-gate.json` | `architecture-gate-failed` | Inspect smoke/performance subsection and avoid release packaging. |
| Docs drift fails | `npm run test:docs:drift` JSON output | `docs-drift` | Align backlog/current-focus/done-log/prompts/specs. |
| VSIX missing | `.dist/vsc-powersyntax.vsix` | `vsix-missing` | Run `npm run package:vsix`. |
| VSIX contains forbidden files | `npm run verify:vsix-contents` | `vsix-surface-invalid` | Fix `package.json` `files` or build output before release. |
| Installed smoke fails | `smoke-installed` label output | `installed-smoke-failed` | Treat package as broken even if `vsce package` succeeded. |

## PBAutoBuild

| Symptom | Check first | Likely reason code | Action |
| --- | --- | --- | --- |
| Tool not found | `vscPowerSyntax.build.pbAutoBuildPath`, `PB_AUTOBUILD_PATH` | `tool-missing` | Configure `PBAutoBuild250.exe` explicitly or install the tool. |
| Unsupported platform | OS/runtime status | `unsupported-platform` | Treat PBAutoBuild as unavailable on non-supported hosts. |
| Build JSON missing | build files inventory | `config-json-missing` | Select or create a usable build JSON before running. |
| Build JSON invalid | build health report | `config-json-invalid` | Fix JSON schema/paths before invoking the runner. |
| Source control auth failure | redacted log summary | `source-control-auth-failure` | Reconfigure credentials outside repo/logs. |
| Runtime/toolkit missing | build health/support matrix | `runtime-missing` | Install required runtime/toolkit for the chosen build mode. |
| Compile failure | mapped build problems | `compile-error` | Open mapped Problems entries when source mapping is reliable. |
| Deploy failure | error log summary | `deploy-error` | Inspect redacted error log and deployment target configuration. |
| Timeout or cancel | runner state | `timeout` or `cancelled` | Adjust timeout or rerun after checking long-running steps. |

PBAutoBuild modes must stay explicit. JSON `/f` and PBC `/pbc` use validated arguments, not arbitrary shell strings. Password encryption `/p` may be documented for users, but passwords must never be captured in logs or committed configuration.

## ORCA

| Symptom | Check first | Likely reason code | Action |
| --- | --- | --- | --- |
| ORCA unavailable | `vscPowerSyntax.legacy.orcaPath`, `PB_ORCA_PATH` | `orca-tool-missing` | Configure the executable explicitly. |
| Session DLL missing | `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL`, `pborc250.dll` fallback | `orca-session-missing` | Configure or install the compatible session DLL. |
| Export blocked | `.vsc-powersyntax/orca-export/state/last-export.state` | `orca-export-blocked` | Review source root, aliases and generated script path. |
| Import blocked | `last-import-ledger.json`, source fingerprints | `stale-staging` | Re-export staging and verify source drift before import. |
| Backup missing | ORCA ledger | `backup-missing` | Do not retry write-enabled import without a valid backup. |
| Packaging requested | ORCA packaging policy | `packaging-disabled` | EXE/PBD/DLL packaging is not exposed without a dedicated feature flag. |
| Runner failed | ORCA runner output | `orca-runner-failed` | Use the redacted log and generated script as evidence. |

ORCA is an advanced optional rail. It must not become a runtime dependency for discovery, indexing, hover, completion, diagnostics, definition or read-only DataWindow analysis.

## Support Bundles And Logs

Support bundles should include summaries, reason codes, manifests and redacted excerpts. They should not include credentials, PATs, passwords, full private source dumps or massive logs by default.

Useful artifacts:

- `.dist/vsc-powersyntax.vsix`
- `artifacts/performance/architecture-rapid-gate.json`
- `artifacts/performance/performance-budget-gate.json`
- `.vsc-powersyntax/runtime/build-orca-journal.json`
- `.vsc-powersyntax/orca-export/state/last-export.state`
- `.vsc-powersyntax/orca-export/state/last-import-ledger.json`
- `tools/pbautobuild-ci/<perfil>`
