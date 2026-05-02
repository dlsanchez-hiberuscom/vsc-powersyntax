# Plan - Spec 279 PBL/source synchronization safety (B196)

1. Guardar en `last-export.state` el estado del source real rastreado que corresponde al staging exportado.
2. Usar ese estado en el preflight de `import` para diferenciar staging-only edits válidos de source real cambiado desde el export.
3. Validar con unit + smoke ORCA y mover el foco canónico a `B197`.