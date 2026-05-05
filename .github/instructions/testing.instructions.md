---
name: Testing standards
description: Unit, integration, smoke and performance test rules.
applyTo: "**/*test*/**,**/*.spec.ts,**/*.test.ts"
---
- Tests must lock behavior, not implementation accidents.
- Cover positive, negative and low-confidence cases.
- Use realistic PowerBuilder/PFC/STD/DataWindow fixtures when needed.
- Do not depend on private local fixtures unless gated and documented.
- Never weaken assertions just to pass CI.
