# Tasks - Spec 264 KnowledgeBase copy-on-write e indices de consulta acotada (B230)

## 1. Preparacion

- [x] T1. Localizar el cuello de botella en `cloneState()/writeState()` y confirmar el camino de mutacion real.
- [x] T2. Verificar los consumers cercanos de `queryEntities/countEntities` para decidir si hacia falta un indice acotado adicional.

## 2. Implementacion

- [x] T3. Introducir copy-on-write por bucket en `KnowledgeBase`.
- [x] T4. Mantener sincronizados el indice por `kind`, el total de entidades y las dependencias inversas.
- [x] T5. Reutilizar el conteo acotado por `kind` en `semanticWorkspaceManifest`.

## 3. Validacion

- [x] T6. Ampliar la unit de `KnowledgeBase` con el nuevo contrato visible.
- [x] T7. Añadir benchmark sintetico incremental con miles de documentos.
- [x] T8. Revalidar el benchmark en el runner oficial `npm run test:performance -- --grep "knowledgeBase"`.

## 4. Cierre

- [x] T9. Actualizar docs canónicas y mover el foco a `B231`.