# Tasks - Spec 277 ORCA import and compile controlled (B193)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en abrir el carril write-enabled sobre `last-export.state`, no en reabrir el runner ORCA ni el graph read-only ya cerrados.

## 2. Implementación

- [x] T2. Añadir contrato compartido y helper server-side para preflight, backup binario, script `import-from-staging.orc` y ledger persistido.
- [x] T3. Publicar `powerbuilder.importOrcaStaging` / `vscPowerSyntax.importOrcaStaging` y enchufarlo al menú de estado sin abrir un segundo motor ORCA.

## 3. Validación

- [x] T4. Añadir tests focales para preflight, fingerprint mismatch, backup binario y wiring visible del comando.

## 4. Cierre

- [x] T5. Actualizar docs canónicas y mover el foco a `B194`.