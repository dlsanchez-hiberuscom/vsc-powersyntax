---
name: testing-validation
description: Designs unit, integration, smoke and performance tests for PowerBuilder plugin behavior.
---

# Testing Validation

## Use when
Use when new behavior needs tests or CI/release checks fail.

## Workflow
1. Pick the smallest test level that proves behavior.
2. Add positive, negative and confidence-edge cases.
3. Use realistic PB/PFC/STD/DW fixtures when needed.
4. Keep CI deterministic.
5. Run and report exact commands.

## Output
- Findings or changes required
- Tests/docs affected
- Validation commands/results
- Remaining risks or unknowns
