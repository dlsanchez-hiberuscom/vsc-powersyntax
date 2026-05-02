# Plan - Spec 281 Spec-driven PBL update workflow (B199)

1. Reutilizar el `safeEditPlan` como gate de seguridad antes de cualquier automatización write-enabled.
2. Encadenar export ORCA fresco, resolución staging por `trackedSources`, edits explícitos e import seguro sobre el rail ya existente.
3. Validar con tests focales + smoke ORCA y mover el foco canónico a `B200`.