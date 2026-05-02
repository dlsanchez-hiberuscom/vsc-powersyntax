# Plan - Spec 292 Safe batch rename/refactor planning (B249)

1. Refactorizar el `safeEditPlan` existente para poder reutilizarlo desde impacto ya calculado.
2. Orquestar un planner batch read-only sobre validacion, impacto y edit planning actuales.
3. Publicarlo por API/tool bridge y validarlo con test unitario focal y smoke basico.
