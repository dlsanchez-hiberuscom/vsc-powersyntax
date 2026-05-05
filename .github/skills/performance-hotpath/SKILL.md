---
name: performance-hotpath
description: Protects activation, discovery, indexing, caching and incremental update performance.
---

# Performance Hotpath

## Use when
Use when activation, indexing, watchers, parsing, cache, large fixtures or workspace discovery are touched.

## Workflow
1. Identify hot-path code.
2. Reject sync full scans or deep startup work.
3. Prefer incremental invalidation.
4. Measure or add a budget gate.
5. Document performance evidence.

## Output
- Findings or changes required
- Tests/docs affected
- Validation commands/results
- Remaining risks or unknowns
