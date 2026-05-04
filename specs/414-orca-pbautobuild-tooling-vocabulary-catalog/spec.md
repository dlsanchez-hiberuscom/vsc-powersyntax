# Spec 414 — B340 ORCA/PBAutoBuild tooling vocabulary catalog

## Estado

- done

## Relación backlog

- Backlog item: `B340 — ORCA/PBAutoBuild tooling vocabulary catalog`

## Objetivo

Modelar vocabulario de tooling PowerBuilder para ORCA/PBAutoBuild fuera del hot path semántico, de modo que build/health/docs surfaces puedan reutilizarlo sin contaminar resolución PowerScript/DataWindow.

## Resultado de cierre

- `src/server/knowledge/system/manual/tooling/index.ts` publica `tooling-symbols` bajo el namespace `powerbuilder-tooling` para ORCA, PBAutoBuild, env vars y settings de tooling;
- `src/server/knowledge/system/manual/index.ts` incorpora ese slice al dataset `manual-core` y el consistency report publica ya el nuevo dominio sin romper provenance ni counts del catálogo;
- `src/server/knowledge/system/services/queryService.ts` excluye `tooling-symbols` de `resolveLanguageSymbol()`, manteniendo el vocabulario visible sólo por acceso explícito al catálogo y fuera del hot path interactivo.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/toolingCatalog"`

## Fuera de alcance del corte cerrado

- consumir `tooling-symbols` desde hover/completion/queries interactivas del lenguaje;
- convertir ORCA/PBAutoBuild en tipos o keywords PowerScript dentro del catálogo principal del lenguaje;
- abrir una surface runtime nueva sólo para publicar este vocabulario si `SystemCatalog` y el consistency report ya bastan.