---
name: PowerScript semantics
description: Parser, symbols, diagnostics and PowerBuilder semantic behavior.
applyTo: "**/*.ts,**/*.tsx,**/*.sru,**/*.srf,**/*.srw,**/*.sra,**/*.srm,**/*.srd"
---
- Model PowerBuilder semantics explicitly; do not project TypeScript/Java/C# semantics onto PowerScript.
- Keep scope resolution evidence-based: local, argument, instance, shared, global, inherited and system/catalog.
- Diagnostics require stable code, reason code, source origin and confidence.
- Quick fixes require reliable source origin; otherwise report only.
- Preserve legacy PFC/STD patterns unless contradicted by official docs or project specs.
