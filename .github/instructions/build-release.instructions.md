---
name: Build and release
description: CI, VSIX, release-readiness and external PowerBuilder tool rules.
applyTo: ".github/workflows/**,package.json,**/*release*/**,**/*build*/**"
---
- CI must not require unavailable private fixtures unless explicitly gated.
- ORCA/PBAutoBuild are optional external rails; never required for normal language features.
- Do not hardcode local PowerBuilder installation paths.
- VSIX must exclude local fixtures, logs, caches and temporary artifacts.
- Release readiness must fail on real blockers, not hide failures broadly.
