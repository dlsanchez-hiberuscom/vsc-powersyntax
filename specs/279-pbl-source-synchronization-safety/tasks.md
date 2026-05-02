# Tasks - Spec 279 PBL/source synchronization safety (B196)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en distinguir source real cambiado vs edición deliberada sobre staging, no en abrir un nuevo comando ORCA.

## 2. Implementación

- [x] T2. Persistir fingerprints del source real rastreado durante el export ORCA.
- [x] T3. Ampliar el preflight de import para bloquear `stale staging` y `source-conflict` solo sobre los objetos staged.

## 3. Validación

- [x] T4. Añadir tests focales que prueben el caso permitido de staging-only edit y el bloqueo cuando cambió el source real.

## 4. Cierre

- [x] T5. Activar reglas PBL canónicas, alinear docs y mover el foco a `B197`.