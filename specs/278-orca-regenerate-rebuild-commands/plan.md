# Plan - Spec 278 ORCA regenerate and rebuild commands (B194)

1. Reutilizar el rail ORCA write-enabled ya cerrado en `B193` y añadir dos operaciones nuevas sin duplicar preflight ni backup.
2. Publicar `regenerate/rebuild` en servidor y cliente, bloqueando `rebuild` cuando falte un target/project legacy persistido.
3. Validar con unit + smoke ORCA y mover el foco canónico a `B196`.