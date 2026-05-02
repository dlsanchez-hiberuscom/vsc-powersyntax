# Plan - Spec 282 Bulk PBL export/import orchestration (B200)

1. Reutilizar `applySpecDrivenPblUpdate()` como executor único por item en lugar de duplicar ORCA.
2. Añadir un wrapper batch secuencial con `stopOnError`, carga documental por item y resumen agregado.
3. Validar con unit batch + smoke ORCA y devolver el foco canónico a `B081`.