# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B378 — AI PowerBuilder context pack and token budget contract`

Estado actual: `B375` queda cerrada. El rail `localization/` ya recupera overlays cuando un `targetId` queda obsoleto pero `targetKey` sigue resolviendo la identidad canónica, publica esos casos como `recoveredTargetIds` en el audit y deja un migrador offline para reconciliar los IDs fuente sin meter heurísticas en hot path.

La evidencia vigente que deja `B375` es:

- `src/server/knowledge/system/localization/localizationResolver.ts` deja de tratar un `targetId` envejecido como huérfano automático cuando `targetKey` sigue resolviendo un target canónico único, pero mantiene esa recuperación como evidencia explícita (`recoveredTargetIds`) y no como magia silenciosa en el runtime;
- `src/server/knowledge/system/consistency.ts`, `localization/types.ts` y `localization/index.ts` publican ese drift recuperable dentro del audit contractual junto a `orphanOverlays`, `incompleteOverlays` e `invalidParameterTargets`;
- `scripts/generate_catalog_localization_report.cjs` y `scripts/migrate_catalog_localization_target_ids.cjs`, expuestos por `npm run report:catalog-localization` y `npm run migrate:catalog-localization-target-ids`, dejan snapshot y migración offline explícita del source localizado;
- `test/server/unit/catalogLocalization.test.ts` fija ya un fixture sintético de `targetId` obsoleto recuperado por `targetKey`, mientras `catalogConsistency.test.ts` exige `0 recoveredTargetIds` en el baseline vivo para que no quede drift latente.

Con la cadena B371-B375 ya cerrada, el siguiente cuello de botella pasa a ser de contexto operativo para IA: toca abrir `B378` para condensar arquitectura, reglas PowerBuilder, validación y ownership documental en un pack breve, estable y versionable que no obligue a cargar medio repositorio en cada tarea asistida.

---

## 2. Por qué es prioritario

Con `B375` cerrada, la localización visible y su gobernanza ya están resueltas; ahora falta reducir el coste de contexto para automatización/IA:

- `B378` debe bajar tokens y ruido operativo para agentes sin duplicar documentos propietarios ni perder exactitud sobre foco, arquitectura y reglas del proyecto;
- la base documental ya es rica, pero sigue demasiado dispersa para prompts cortos y tareas IA repetitivas;
- si no se fija ahora, cada automatización seguirá cargando contexto excesivo y mezclando reglas canónicas con resúmenes ad hoc de peor calidad.

---

## 3. Trabajo permitido ahora

- crear `docs/ai-context/powerbuilder-plugin-context.md` como context pack compacto y estable;
- enlazar desde ese pack a arquitectura, reglas PowerBuilder, SQL/DataWindow, validación, foco activo y ownership documental sin duplicar contenido largo;
- añadir el mínimo guard documental necesario para que el pack siga referenciado y alineado cuando cambie el foco.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B375` salvo regressión real del fallback por `targetKey`, del audit `recoveredTargetIds` o del migrador offline;
- duplicar documentación larga o arrastrar datasets `generated/manual` completos dentro del context pack;
- abrir features runtime nuevas, tooling write-enabled o claims de producto fuera del alcance documental de `B378`;
- inventar reglas PowerBuilder no presentes en la documentación propietaria vigente.

---

## 5. Criterios de salida del foco actual

- existe `docs/ai-context/powerbuilder-plugin-context.md`;
- el pack recoge arquitectura, reglas críticas, comandos de validación, do-not-do y foco activo sin duplicar documentos largos;
- el pack enlaza a documentos propietarios en vez de sustituirlos;
- `ai-strategy`, `ai-orchestrator`, `developer-workflows`, `spec-driven-development`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B379` — Explain diagnostic tool and suggested safe fix contract.
2. `B380` — Explain system symbol and catalog lookup tool for AI.
3. `B381` — AI task context bundle orchestration tool.

---

## 7. Regla final

`B378` debe construir sobre el estado ya cerrado del plugin. No toca reabrir runtime ni catálogo: toca empaquetar contexto estable, breve y accionable para IA sin duplicar documentación propietaria ni rebajar el listón técnico del repositorio.
