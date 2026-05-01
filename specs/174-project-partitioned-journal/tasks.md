# Tasks - Spec 174 Journal persistente particionado por proyecto (B071A)

## 1. Preparacion

- [x] T1. Reutilizar el borde local del cache store abierto por `Spec 173`.
- [x] T2. Fijar un test que discrimine journal global frente a journal particionado.

## 2. Implementacion

- [x] T3. Particionar appendJournalMutation por proyecto y workspace.
- [x] T4. Mantener secuencias y payloads por partición.
- [x] T5. Restaurar cada partición con su propio journal antes de agregar.

## 3. Validacion

- [x] T6. Ejecutar el test estrecho del slice.
- [x] T7. Ejecutar compile y unit completos.
- [x] T8. Ejecutar el baseline completo del repositorio.

## 4. Cierre

- [x] T9. Actualizar backlog, foco, roadmap y done-log.
- [x] T10. Marcar la spec como cerrada y trazable.