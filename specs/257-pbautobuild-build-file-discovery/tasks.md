# Tasks - Spec 257 PBAutoBuild build-file discovery and validation (B182)

## 1. Preparacion

- [x] T1. Confirmar que el slice vive en servidor/workspace model y no en cliente.
- [x] T2. Definir shape mínimo del build file (`BuildPlan` + referencias a markers PB).

## 2. Implementacion

- [x] T3. Implementar parser/clasificador puro para candidatos JSON de PBAutoBuild.
- [x] T4. Integrar el catálogo en `WorkspaceState` y en el discovery inicial.
- [x] T5. Integrar refresh incremental por watcher para create/change/delete de `.json`.
- [x] T6. Exponer un resumen read-only en stats del servidor.

## 3. Validacion

- [x] T7. Añadir tests unitarios focalizados del parser y de la integración.
- [x] T8. Ejecutar compilación + mocha estrecho de B182.

## 4. Documentacion

- [x] T9. Actualizar docs canónicas y mover `B182` a cierre antes de abrir la siguiente spec.