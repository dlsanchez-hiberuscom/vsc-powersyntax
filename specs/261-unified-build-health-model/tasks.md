# Tasks - Spec 261 Unified build health model (B187)

## 1. Preparación

- [x] T1. Identificar las señales reales del build moderno ya existentes: capability detection, build files, runner y problemas recientes.
- [x] T2. Definir un snapshot único reutilizable por las superficies de estado del cliente.

## 2. Implementación

- [x] T3. Implementar el builder puro de build health.
- [x] T4. Reutilizar el snapshot en tooltip, stats, health report y menú.

## 3. Validación

- [x] T5. Añadir tests del snapshot con estados `ready`, `blocked` y `attention`.
- [x] T6. Validar la proyección visible del snapshot y la smoke corta del carril moderno.

## 4. Cierre

- [x] T7. Alinear docs y cerrar `B187` con `B185` como siguiente foco natural del carril moderno.