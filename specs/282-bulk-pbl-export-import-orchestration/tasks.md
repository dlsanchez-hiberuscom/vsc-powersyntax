# Tasks - Spec 282 Bulk PBL export/import orchestration (B200)

## 1. Preparación

- [x] T1. Confirmar que el hueco real era una coordinación batch sobre `B199`, no otro rail ORCA.

## 2. Implementación

- [x] T2. Publicar una API versionada batch para múltiples requests PBL.
- [x] T3. Reutilizar secuencialmente `applySpecDrivenPblUpdate()` con `stopOnError` y resumen agregado por item.

## 3. Validación

- [x] T4. Añadir tests del batch feliz, corte temprano y continuación explícita, más smoke ORCA de regresión.

## 4. Cierre

- [x] T5. Alinear docs/specs y devolver el foco a `B081`.