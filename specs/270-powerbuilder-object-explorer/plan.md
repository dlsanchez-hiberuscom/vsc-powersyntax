# Plan - Spec 270 PowerBuilder Object Explorer (B214)

## 1. Enfoque técnico

Resolver `B214` mayoritariamente en cliente, ampliando solo el manifest read-only con metadatos por objeto suficientes para evitar RPCs por nodo. El árbol debe apoyarse en `semanticWorkspaceManifest` + `project model` y limitarse a UX observable.

## 2. Pasos

1. Enriquecer `semanticWorkspaceManifest` con `projectUri`, `library`, `objectKind` y `readiness` por objeto.
2. Construir un modelo puro proyecto -> librería -> kind -> objeto.
3. Registrar la vista `powerbuilderObjectExplorer` y comandos de foco/refresco/apertura segura.
4. Validar el modelo puro, el contrato enriquecido y el foco visible sobre archivo activo.
5. Actualizar docs canónicas y mover el foco a `B215`.

## 3. Riesgos

- caer en RPCs por nodo o refreshes demasiado costosos para poblar el árbol;
- duplicar lógica de routing/proyecto fuera del manifest/project model;
- ofrecer acciones contextuales que muten estado o simulen semántica local inexistente.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "Object Explorer en el archivo activo"`

## 5. Resultado ejecutado

1. El usuario navega el workspace PowerBuilder desde un explorer read-only.
2. El árbol reutiliza el manifest enriquecido en vez de consultar nodo a nodo.
3. `B215` pasa a ser el siguiente foco UX/read-only.