# Plan - Spec 280 Build and ORCA event journal (B197)

1. Reusar `RuntimeJournal` como fuente única de eventos y proyectar solo `build|legacy` a un store persistente por workspace.
2. Publicar la ubicación del journal persistente en `showStats` y reforzar el payload técnico de build/ORCA donde aún faltaba contexto.
3. Validar con unit focal + smoke ORCA y mover el foco canónico a `B199`.