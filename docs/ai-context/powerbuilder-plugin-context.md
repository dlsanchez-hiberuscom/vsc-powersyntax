# AI context — PowerBuilder plugin

Context pack corto para tareas IA sobre este repositorio.

Este documento no sustituye la documentacion propietaria. Si hay conflicto, ganan `docs/constitution.md`, `docs/architecture.md`, `docs/current-focus.md` y el resto de documentos propietarios.

## Mission

- Mantener un plugin profesional de VS Code para PowerBuilder y PowerScript, no una aplicacion de negocio PowerBuilder.
- Proteger discovery/indexacion rapida, cliente ligero, LSP separado, prioridad al archivo activo y degradacion segura.
- Preferir contexto breve, estable y accionable antes que prompts masivos o resumentes ad hoc.

Owner docs: `docs/product-operating-model.md`, `docs/constitution.md`, `docs/current-focus.md`.

## Architecture boundaries

- `src/client/` debe seguir ligero; parsing, semantica, knowledge y trabajo costoso viven en `src/server/`.
- La IA consume contratos publicos, tools read-only y context packs; no estructuras internas mutables ni atajos fuera de API.
- No meter IA dentro del core ni en hot paths de serving, discovery, scheduler o indexing.
- No usar ORCA en hot path y no tratar `orca-staging` como source canonico.

Owner docs: `docs/architecture.md`, `docs/ai-orchestrator.md`, `AGENTS.md`.

## PowerBuilder coding rules

- Tratar este repo como plugin/language tooling; los archivos PowerBuilder son corpus, fixtures y evidencia de comportamiento real.
- Respetar scopes, prototypes, implementations, eventos, herencia, `sourceOrigin`, readiness, evidence y confidence.
- Empezar por el ancla mas local posible: archivo, simbolo, test, comando o comportamiento fallido.
- Preferir cambios pequenos y verificables; cerrar siempre con validacion y documentacion alineada.

Owner docs: `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/rules-catalog.md`, `docs/spec-driven-development.md`.

## SQL formatting rules

- Reutilizar `sqlRegions`, transaction binding y anchors SQL existentes; no abrir un parser SQL general nuevo.
- Mantener SQL embebido como carril explicable y conservador, con degradacion honesta cuando el binding no sea defendible.
- No reformatear strings arbitrarios como si fuesen SQL estructurado.

Owner docs: `docs/developer-workflows.md`, `docs/rules-catalog.md`.

## DataWindow rules

- DataWindow es un sublenguaje propio; no parsearlo como PowerScript normal.
- Reutilizar `DataWindowModel`, `retrieveArguments`, lineage y bindings existentes; no duplicar parser por consumer.
- Si `DataObject` o expresiones son dinamicas, degradar de forma conservadora y explicita.

Owner docs: `docs/developer-workflows.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## Catalog/generated/manual/localization rules

- No cargar el catalogo `generated` o `manual` completo dentro de prompts.
- `generated` sigue siendo la base oficial; `manual` y `localization` son overlays curados y auditables, no un segundo catalogo paralelo.
- Para localizacion: `targetId` cuando el ID es estable; `targetKey` cuando hace falta tolerar drift de regeneracion; la reconciliacion del source es offline.
- Consultar y validar mediante tooling/catalog reports existentes antes de introducir nuevas reglas o ejemplos.

Owner docs: `docs/architecture.md`, `docs/localization.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## Validation commands and tools

- Comprobacion amplia read-only: `workspace-check`, `checkWorkspace()`, comando `PowerSyntax: Check Workspace`.
- Comprobacion local read-only: `object-check`, `checkObject()`, comandos `PowerSyntax: Check Current Object` y `PowerSyntax: Check Object...`.
- Comprobacion puntual de diagnostics: `explain-diagnostic`, `explainDiagnostic()`, comando `PowerSyntax: Explain Diagnostic at Cursor`.
- Comprobacion puntual de simbolos del lenguaje: `explain-system-symbol`, `explainSystemSymbol()`, comando `PowerSyntax: Explain System Symbol at Cursor`.
- Baseline comun:
  - `npm run build:test`
  - `npm run test:unit -- --grep "docs|ai-context|context-budget|documentation"`
- Si tocas localizacion/catalogo:
  - `npm run report:catalog-localization`
  - `npm run migrate:catalog-localization-target-ids`
- Si el cambio es mas amplio o de release:
  - `npm run release:verify`

Owner docs: `docs/testing.md`, `README.md`, `docs/localization.md`.

## Recommended AI workflow

1. Leer este pack, `docs/current-focus.md` y la documentacion propietaria minima necesaria.
2. Si la tarea es amplia, empezar con `workspace-check`; si es local, empezar con `object-check` o un test/comando/simbolo concreto.
3. Formular una hipotesis local falsable antes del primer cambio.
4. Hacer el cambio mas pequeno que pruebe esa hipotesis.
5. Validar inmediatamente con el check mas estrecho disponible.
6. Actualizar docs vivas y backlog/done-log/current-focus cuando el trabajo se cierre.

Owner docs: `docs/ai-orchestrator.md`, `docs/spec-driven-development.md`, `AGENTS.md`.

## Do not do

- No tratar el repo como una app PowerBuilder empresarial.
- No duplicar documentos largos dentro de prompts o dentro de este pack.
- No pegar datasets `generated/manual/localization` completos en el contexto IA.
- No abrir features fuera del foco activo sin evidencia o backlog claro.
- No cerrar trabajo sin validacion, `done-log` y foco alineados.
- No reimplementar semantica fuera del pipeline/knowledge existente.

## Active focus

- Foco actual tras cerrar B380: `B381 — AI task context bundle orchestration`.
- Evidencia nueva ya disponible para B381: `workspace-check`, `object-check`, `explain-diagnostic` y `explain-system-symbol`.
- La autoridad del foco vivo siempre es `docs/current-focus.md`, no este resumen.

## Documentation ownership

- Reglas no negociables: `docs/constitution.md`
- Arquitectura y boundaries: `docs/architecture.md`
- Foco y secuencia: `docs/current-focus.md`, `docs/backlog.md`, `docs/done-log.md`
- SDD y cierre: `docs/spec-driven-development.md`
- Estrategia/orquestacion IA: `docs/ai-strategy.md`, `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`
- Dominio PowerBuilder y workflows: `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/developer-workflows.md`, `docs/rules-catalog.md`, `docs/testing.md`

Contrato de budget: este pack debe seguir siendo pequeno y enlazado. Si empieza a duplicar reglas largas, hay que recortarlo y devolver el detalle al documento propietario correspondiente.