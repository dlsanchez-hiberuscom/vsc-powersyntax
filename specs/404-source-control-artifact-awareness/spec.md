# Spec 404 — B309 Source control artifact awareness

## Estado

- done

## Relacion backlog

- Backlog item: `B309 — Source control artifact awareness`

## Objetivo

Reconocer artefactos `Git/SVN/SCC` y outputs locales del workspace para evitar indexar ruido y mejorar `workspaceMigrationAssistant` sin ejecutar SCM, sin abrir un planner paralelo y sin aplicar limpieza destructiva.

## Resultado de cierre

- `src/server/workspace/discovery.ts` registra ya metadata/policy files SCM (`.git`, `.svn`, `.gitignore`, `.gitattributes`, `.scc`) y outputs locales (`.pb`, `build`, `_backupfiles`) en `WorkspaceState`, manteniéndolos fuera de roots/source sin perder esa señal read-only;
- `src/server/features/workspaceMigrationAssistant.ts` publica recomendaciones `source-control-artifacts` y `local-artifact-noise` para explicar qué se ignora, qué no debe competir con topología/build canónicos y qué artefactos deben tratarse sólo como governance o ruido local;
- `test/server/unit/workspace.test.ts` y `workspaceMigrationAssistant.test.ts` fijan el carril `discover -> state -> migration assistant` con fixtures de SCM y export artifacts.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(workspace|workspaceMigrationAssistant)"`

## Fuera de alcance del corte cerrado

- ejecutar Git/SVN/SCC o depender de repos remotos para clasificar el workspace;
- borrar caches, outputs o artefactos SCM por defecto;
- mezclar este slice de awareness con un cleanup advisor write-enabled, que queda como foco separado en `B313`.