# Release Readiness

## Owner

This document owns release, VSIX packaging, Marketplace policy and release artifact rules. Local build workflows stay in [docs/developer-workflows.md](developer-workflows.md), validation lanes in [docs/testing.md](testing.md), and operational failures in [docs/troubleshooting.md](troubleshooting.md).

## Release Readiness Lane

Run the full local release lane with:

```sh
npm run release:verify
```

The lane is intentionally package-only. It never publishes automatically.

Current command chain:

1. `npm test`
2. `npm run test:architecture:rapid`
3. `npm run test:docs:drift`
4. `npm run test:performance:gate`
5. `npm run verify:catalog-coverage`
6. `npm run package:vsix`
7. `npm run verify:vsix-contents`
8. `npm run test:smoke:installed-vsix`
9. `npm run release:summary`

The final summary prints the extension version, Git commit, VSIX path and validation commands that were executed.

## VSIX Artifact

The canonical local artifact is:

```text
.dist/vsc-powersyntax.vsix
```

[package.json](../package.json) uses an explicit `files` allowlist for product packaging. [tools/verify-vsix-contents.mjs](../tools/verify-vsix-contents.mjs) checks the generated VSIX and blocks local fixtures, tests, source, caches, temp files, scripts, tools and build output folders that must not ship.

Use `npm run package:vsix:list` to inspect the package surface before publishing or sharing a build.

## Installed VSIX Smoke

`npm run test:smoke:installed-vsix` runs the `smoke-installed` label from [.vscode-test.js](../.vscode-test.js). That label installs `.dist/vsc-powersyntax.vsix` into isolated user-data and extension directories, without using `extensionDevelopmentPath`, and verifies activation from the packaged extension.

This smoke must pass before treating a VSIX as release-ready.

## CI Release Readiness

[.github/workflows/release-readiness.yml](../.github/workflows/release-readiness.yml) runs `xvfb-run -a npm run release:verify` on `workflow_dispatch`, `push` to `main`, and `pull_request`.

The workflow uploads `.dist/vsc-powersyntax.vsix` as artifact `vsc-powersyntax-vsix` with `retention-days: 14`. Packaging and publishing remain separate: this workflow does not publish to Marketplace.

## Versioning And Changelog

- Update `package.json` `version` only as part of an explicit release or pre-release decision.
- Keep [CHANGELOG.md](../CHANGELOG.md) aligned with user-visible release notes and relevant developer-facing operational changes.
- Do not update `docs/done-log.md` merely because a package was built; use it only for fully closed specs/audits.
- Artifact naming remains stable at `.dist/vsc-powersyntax.vsix` for local and CI validation.

## Marketplace And Pre-Release Policy

Publishing is a separate, explicit maintainer action.

- Use `vsce package` through `npm run package:vsix` for local artifacts.
- Use `vsce publish` or `vsce publish --pre-release` only after `npm run release:verify` is green and a maintainer approves publication.
- Store Marketplace credentials in CI secrets such as `VSCE_PAT`; never commit PATs, passwords or publisher credentials.
- Do not echo secrets in logs, support bundles, release summaries or troubleshooting output.
- Marketplace metadata, icons, README and changelog must be reviewed before publish.

## External Build Tools Boundary

PBAutoBuild and ORCA are optional external rails. They are not release prerequisites for basic LSP functionality unless a release explicitly targets those rails. Absence of PowerBuilder IDE, PBAutoBuild or ORCA must not block extension activation, syntax, LSP startup, hover, completion, diagnostics or read-only reports.

Use [docs/troubleshooting.md](troubleshooting.md) for PBAutoBuild/ORCA failure classification and [docs/developer-workflows.md](developer-workflows.md) for day-to-day build commands.

## Catalog Localization Changes

`npm run release:verify` gates catalog coverage through `verify:catalog-coverage`, but it does not automatically regenerate the localization report. Changes under [src/server/knowledge/system/localization](../src/server/knowledge/system/localization) must separately run the localization lane from [localization.md](localization.md): focused unit grep, `report:catalog-localization` and `migrate:catalog-localization-target-ids` dry-run before release evidence is considered complete.

## Pre-Release Cleanup Checklist

Before sharing or publishing a candidate VSIX, verify:

1. Backlog/current-focus/done-log are aligned.
2. Docs drift is green.
3. `src/**` has no static, dynamic or CommonJS imports into `plugin_old/**`.
4. No critical TODO is left without [docs/technical-debt-inventory.md](technical-debt-inventory.md) or backlog trace.
5. Release scripts match [docs/testing.md](testing.md) and this document.
6. VSIX contents exclude secrets, logs, local fixtures, source, tests, caches and temp artifacts.
7. Any removal has a cleanup receipt with tests and rollback path.
