# Tasks - Spec 278 ORCA regenerate and rebuild commands (B194)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en ampliar el rail ORCA write-enabled existente, no en abrir un segundo helper o un segundo runner.

## 2. Implementación

- [x] T2. Generalizar el helper ORCA write-enabled con operaciones `regenerate` y `rebuild`, scripts dedicados y ledgers persistidos.
- [x] T3. Publicar comandos server/client visibles y bloquear `rebuild` cuando el export persistido no conserva target/project legacy suficiente.

## 3. Validación

- [x] T4. Añadir tests focales para el script `regenerate`, el bloqueo de `rebuild` y el wiring visible de los comandos ORCA nuevos.

## 4. Cierre

- [x] T5. Actualizar docs canónicas y mover el foco a `B196`.