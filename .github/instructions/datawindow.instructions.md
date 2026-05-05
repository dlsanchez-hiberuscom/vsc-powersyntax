---
name: DataWindow safety
description: DataWindow/DataStore analysis and generated source handling.
applyTo: "**/*datawindow*/**,**/*.srd,**/*.srw,**/*.sru"
---
- Treat DataWindow source as a distinct domain, not generic PowerScript.
- Use safe mode by default; advanced interpretation must be gated and documented.
- DataWindow constants/properties must come from catalog/official evidence, not guesses.
- Do not block activation or normal editing with deep DataWindow analysis.
- Preserve sourceOrigin/confidence on columns, controls, computed fields, buffers and references.
