# PowerBuilder Plugin — AI Context Pack

Context pack compacto para prompts y agentes con budget reducido.

## Mission

Mantener un plugin profesional de PowerBuilder 2025 para VS Code que descubra e indexe muy rapido sin bloquear.

## Architecture boundaries

- Cliente VS Code minimo.
- Servidor LSP como runtime principal.
- Core semantico agnostico del editor.
- Features como adaptadores finos sobre consultas compartidas.
- IA consume contratos publicos, no estructuras internas mutables.

## PowerBuilder coding rules

- `.srd` es un sublenguaje; no tratarlo como PowerScript general.
- `.pbl` y `.pbd` no son source editable.
- `orca-staging` no gana a source real.
- `generated` no habilita escritura directa.
- Rename y code actions requieren `sourceOrigin` confiable.
- Dynamic calls, PBX, DLL externas, RPCFUNC y strings dinamicos degradan confidence.

## SQL formatting rules

- SQL embebido solo se documenta o analiza cuando el subset es defendible.
- Dynamic SQL debe degradar con riesgo/confidence, no inventar semantica.
- No ejecutar SQL ni prometer runtime DBMS desde el editor.

## DataWindow rules

- Resolver solo rails seguros y literal-only cuando aplique.
- No simular runtime de DataWindow.
- SQL lineage no debe inventar referencias.
- `SetTrans` y `SetTransObject` no son equivalentes.

## Catalog/generated/manual/localization rules

- `generated-primary-with-manual-overlays` es la policy vigente.
- No cambiar IDs generated/manual sin autorizacion explicita.
- La localizacion es overlay documental; no traduce nombres reales PowerBuilder.
- No pegar datasets `generated/manual/localization` completos dentro del prompt.

## Validation commands and tools

- `npm run test:docs:drift`
- `npm test`
- `npm run test:architecture:metrics`
- `npm run test:performance:gate`
- `npm run package:vsix`
- `workspace-check`
- `object-check`
- `explain-diagnostic`
- `current-object-context`
- `safe-edit-plan`

## Recommended AI workflow

1. Leer `AGENTS.md`, `docs/current-focus.md` y `docs/backlog.md`.
2. Cargar la spec activa y el documento propietario del area.
3. Hacer cambios pequenos y validables.
4. Actualizar docs afectadas en la misma sesion.
5. Cerrar con evidencia y sin usar `docs/done-log.md` como foco.

## Do not do

- No inventar features ni alcance.
- No abrir scans completos en hot path.
- No cerrar sin validacion ejecutada.
- No duplicar documentacion larga.
- No tratar historial como trabajo vivo.

## Active focus

El foco vivo siempre se delega a `docs/current-focus.md`.

Si `docs/current-focus.md` indica reposo explicito, no abrir una cadena nueva sin respaldo en backlog y spec.

## Documentation ownership

- Reglas raiz: `AGENTS.md`
- Arquitectura: `docs/architecture.md`
- Estado implementado: `docs/architecture-status.md`
- Trabajo vivo: `docs/backlog.md`
- Foco vivo: `docs/current-focus.md`
- Direccion: `docs/roadmap.md`
- Historico: `docs/done-log.md`
- IA/tools: `docs/ai/ai-integration-architecture.md`
- Agentes: `docs/ai/ai-agents-catalog.md`