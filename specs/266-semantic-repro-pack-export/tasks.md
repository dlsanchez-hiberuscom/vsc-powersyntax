# Tasks - Spec 266 Semantic repro pack export (B175)

## 1. Preparacion

- [x] T1. Confirmar que el repro pack debía resolverse en cliente reutilizando surfaces read-only ya cerradas.
- [x] T2. Delimitar el bundle mínimo útil: manifest, snapshots JSON y archivos relacionados.

## 2. Implementacion

- [x] T3. Crear el builder puro del repro pack.
- [x] T4. Registrar el comando cliente y su entrada en el menú de estado.
- [x] T5. Capturar contexto, impacto, plan seguro, stats y archivos relevantes del workspace.

## 3. Validacion

- [x] T6. Añadir unit del builder del repro pack.
- [x] T7. Añadir smoke de exportación real desde `sample.sru`.
- [x] T8. Revalidar el slice con `build:test` y smoke focal.

## 4. Cierre

- [x] T9. Actualizar docs canónicas y mover el foco a `B232`.