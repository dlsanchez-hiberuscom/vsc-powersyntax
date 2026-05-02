# Plan - Spec 257 PBAutoBuild build-file discovery and validation (B182)

## 1. Enfoque tecnico

Resolver `B182` en servidor, reutilizando `WorkspaceState`, topología y watcher incremental existentes. El cliente solo observa `.json` y transporta eventos; la clasificación real vive en el runtime LSP.

## 2. Pasos

1. Crear un parser puro para candidatos JSON de PBAutoBuild.
2. Resolver referencias a markers `.pbw/.pbt/.pbproj/.pbsln` contra la topología ya descubierta.
3. Integrar el catálogo read-only en discovery completo y watcher incremental.
4. Exponer un resumen mínimo en `showStats`.
5. Añadir tests focalizados y cerrar docs canónicas.

## 3. Riesgos

- tratar cualquier `.json` como build file real;
- introducir invalidaciones semánticas innecesarias por eventos JSON irrelevantes;
- depender de un schema Appeon demasiado grande sin fixtures reales en el repo.

## 4. Validacion

- unit tests del parser puro;
- unit tests de discovery/workspace state;
- unit tests del watcher incremental;
- compilación completa del producto y tests.

## 5. Resultado ejecutado

1. Se introdujo un parser/clasificador puro read-only para build files JSON de PBAutoBuild.
2. El catálogo queda integrado en `WorkspaceState`, discovery inicial y watcher incremental.
3. `showStats` expone ya un resumen de build files sin abrir runner ni log parser.
4. Se validó con compilación y mocha estrecho sobre parser, workspace y watcher.