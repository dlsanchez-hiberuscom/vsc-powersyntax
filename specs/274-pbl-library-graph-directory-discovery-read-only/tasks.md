# Tasks - Spec 274 PBL library graph and directory discovery read-only (B190)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en routing/project model y no en el adapter ORCA.

## 2. Implementación

- [x] T2. Añadir modo `pbl-only` al `WorkspaceState`.
- [x] T3. Extender routing/registry/model para sintetizar nodos legacy de librería desde roots `.pbl`.
- [x] T4. Publicar `kind: library` en el manifest read-only y validar el consumo cliente.

## 3. Validación

- [x] T5. Añadir tests focales para PBL-only en workspace/model/manifest/Object Explorer.
- [x] T6. Revalidar el consumo visible del Object Explorer en la extensión real.

## 4. Cierre

- [x] T7. Actualizar docs canónicas y mover el foco a `B191`.