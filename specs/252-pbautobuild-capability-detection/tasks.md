# Tasks - Spec 252 PBAutoBuild capability detection (B181)

## 1. Preparacion

- [x] T1. Confirmar dueño técnico del slice (`client` read-only, no LSP build runner).
- [x] T2. Definir namespace/configuración y candidatos por defecto.

## 2. Implementacion

- [x] T3. Implementar detector reutilizable de PBAutoBuild.
- [x] T4. Integrar el snapshot en status/health del cliente.
- [x] T5. Mantener degradación explícita para path ausente, inválido o no ejecutable.

## 3. Validacion

- [x] T6. Añadir tests unitarios focalizados.
- [x] T7. Ejecutar validación proporcional.

## 4. Documentacion

- [x] T8. Actualizar docs canónicas afectadas.
- [x] T9. Mover `B181` a done-log solo si cumple AC y no abre ejecución de build.