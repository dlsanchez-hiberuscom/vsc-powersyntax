# Plan - Spec 275 ORCA export to staging source (B191)

## 1. Enfoque técnico

Resolver `B191` sobre el carril ya abierto en `B188-B190`. El gap real no estaba en otro runner ni en discovery moderno, sino en cómo exportar staging sin crear una librería fantasma: por eso el slice correcto fue generar el script ORCA y sostener un alias map explícito desde cada carpeta staging al root `.pbl` legacy original.

## 2. Pasos

1. Extender el contrato ORCA compartido con la forma del export a staging.
2. Implementar un preparador server-side que cree staging, script y state file persistido.
3. Hacer alias-aware `WorkspaceState`, routing, project model y manifest read-only.
4. Exponer el comando cliente/configuración de DLL de sesión sobre el adapter ORCA existente.
5. Validar export/layout/alias restore y mover el foco canónico a `B192`.

## 3. Riesgos

- modelar staging como carpeta `.pbl` y contaminar el graph legacy con librerías duplicadas;
- perder el mapping proyecto/librería tras refresh o reinicio del workspace;
- abrir expectativas de import/write antes de cerrar provenance/prioridad de source.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 5. Resultado ejecutado

1. El plugin exporta roots legacy a `.vsc-powersyntax/orca-export/orca-staging` mediante un script ORCA reproducible.
2. El staging queda integrado en routing/manifest como alias del root `.pbl` original, no como proyecto nuevo.
3. `B192` pasa a ser el siguiente foco del carril legacy para formalizar provenance y prioridad de source.