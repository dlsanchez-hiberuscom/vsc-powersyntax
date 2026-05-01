# Tasks - Spec 183 Flush tras invalidación y shutdown de ServingCache (B071B)

## 1. Preparacion

- [x] T1. Reutilizar el helper runtime y el coordinador dirty existentes.
- [x] T2. Fijar el helper de invalidación con tests unitarios.

## 2. Implementacion

- [x] T3. Añadir helper runtime de invalidación con flush oportuno.
- [x] T4. Reutilizarlo en cambios/cierre y asegurar flush final en shutdown.

## 3. Validacion

- [x] T5. Ejecutar la validacion estrecha del slice.
- [x] T6. Ejecutar compile y unit completos.

## 4. Cierre

- [x] T7. Actualizar backlog, foco y done-log cuando aplique.
- [x] T8. Marcar la spec como cerrada y trazable.