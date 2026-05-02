# Tasks - Spec 269 Project Health Dashboard (B216)

## 1. Preparación

- [x] T1. Confirmar que el dashboard podía resolverse enteramente sobre `showStats` + `semanticWorkspaceManifest` sin abrir un endpoint nuevo.

## 2. Implementación

- [x] T2. Crear el builder puro del dashboard read-only.
- [x] T3. Registrar el comando `vscPowerSyntax.openProjectHealthDashboard` y exponerlo en status menu/tooltip.
- [x] T4. Integrar degradación honesta de ORCA legacy y build moderno sobre el mismo dashboard.

## 3. Validación

- [x] T5. Añadir unit del builder del dashboard.
- [x] T6. Añadir smoke del comando visible del dashboard.
- [x] T7. Revalidar el slice con compile + unit + smoke focal.

## 4. Cierre

- [x] T8. Actualizar docs canónicas y mover el foco a `B214`.