# Spec 405 — B313 Workspace artifact cleanup advisor

## Estado

- done

## Relacion backlog

- Backlog item: `B313 — Workspace artifact cleanup advisor`

## Objetivo

Sugerir limpieza no destructiva de artefactos locales, staging, logs y caches del workspace reutilizando surfaces read-only ya existentes y sin borrar nada por defecto.

## Resultado de cierre

- `src/server/features/workspaceMigrationAssistant.ts` añade acciones manuales para inspeccionar ruido local (`.pb`, `build`, `_backupfiles`) y staging legacy ORCA desde recomendaciones ya visibles del assistant;
- `src/client/support/supportBundle.ts` exporta `workspace-cleanup-advisor.json`, que resume recomendaciones manuales sobre artefactos del workspace, runtime cache/journal, drift de settings y revisión de API/schema versions, enlazándolo además desde `README.md`;
- `src/client/extension.ts` reutiliza `getWorkspaceMigrationAssistant()` al exportar el support bundle para evitar una surface paralela.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(workspaceMigrationAssistant|supportBundle|crossSurfaceGoldenMatrix)"`

## Fuera de alcance del corte cerrado

- borrar caches, staging o artefactos locales automáticamente;
- ejecutar Git/SVN/ORCA como parte del advisor;
- convertir este slice read-only en un cleanup command write-enabled.
