# Tasks - Spec 270 PowerBuilder Object Explorer (B214)

## 1. Preparación

- [x] T1. Confirmar que el manifest actual podía ampliarse con metadatos por objeto sin abrir un endpoint nuevo.

## 2. Implementación

- [x] T2. Enriquecer `semanticWorkspaceManifest` con `projectUri`, `library`, `objectKind` y `readiness` por objeto.
- [x] T3. Crear el modelo puro del explorer y su agrupación proyecto -> librería -> kind -> objeto.
- [x] T4. Registrar la vista `powerbuilderObjectExplorer` con foco `workspace/current-project/current-file` y apertura segura de objeto.

## 3. Validación

- [x] T5. Añadir unit del modelo puro del explorer.
- [x] T6. Revalidar `semanticWorkspaceManifest` con el contrato enriquecido.
- [x] T7. Añadir smoke del foco del explorer sobre el archivo activo.

## 4. Cierre

- [x] T8. Actualizar docs canónicas y mover el foco a `B215`.