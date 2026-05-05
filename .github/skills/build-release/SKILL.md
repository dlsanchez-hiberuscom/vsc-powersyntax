---
name: build-release
description: Maintains CI workflows, VSIX package checks, release-readiness and optional ORCA/PBAutoBuild rails.
---

# Build Release

## Use when
Use for GitHub Actions, package scripts, VSIX, release-readiness, ORCA or PBAutoBuild.

## Workflow
1. Inspect package scripts and workflows.
2. Separate mandatory CI from local/private fixtures.
3. Keep ORCA/PBAutoBuild optional.
4. Validate VSIX exclusions.
5. Report failing commands clearly.

## Output
- Findings or changes required
- Tests/docs affected
- Validation commands/results
- Remaining risks or unknowns
