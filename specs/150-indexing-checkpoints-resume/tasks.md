# Tasks — Spec 150 Indexing Checkpoints and Resume (B155)

## 1. Preparacion

- [x] T1. Definir las etapas del pipeline que pueden emitir checkpoint seguro.
- [x] T2. Definir el contrato minimo del checkpoint y su validacion.

## 2. Implementacion

- [x] T3. Implementar persistencia y carga de checkpoints.
- [x] T4. Integrar el resume con workspaceIndexer y workspaceState.
- [x] T5. Reencolar solo trabajo pendiente o incompatible tras la carga.

## 3. Validacion

- [x] T6. Anadir tests de resume valido e invalido.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar pruebas del indexador o persistencia afectada.

## 4. Cierre

- [x] T9. Reflejar trazabilidad documental de B155.
- [x] T10. Registrar dependencias pendientes hacia B167 y B168 si el primer formato de checkpoint aun no es transaccional.
