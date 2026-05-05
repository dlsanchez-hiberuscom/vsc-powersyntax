---
name: datawindow-analysis
description: Handles DataWindow/DataStore discovery, DataWindow-scoped constants/properties, columns, controls and safe generated-source analysis.
---

# Datawindow Analysis

## Use when
Use for DataWindow, DataStore, `.srd`, DWBuffer, Primary!, Delete!, Filter!, columns, controls or generated source.

## Workflow
1. Decide safe vs advanced mode.
2. Verify constants/properties from catalog/official evidence.
3. Keep generated syntax separate from PowerScript.
4. Add low-confidence tests where source is uncertain.
5. Avoid activation hot-path impact.

## Output
- Findings or changes required
- Tests/docs affected
- Validation commands/results
- Remaining risks or unknowns
