# BLOQUE 10 — AI Tools, Agents, Prompts & Public Contracts

> Objetivo: consolidar una estrategia AI-first segura y mantenible para el plugin PowerBuilder: instrucciones, agentes, prompts, skills/tools, contratos públicos read-only, context bundles, safe-edit workflows y documentación de uso por Copilot/agents, sin saltarse la arquitectura del servidor ni duplicar semántica.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`, los bloques previos y la reorganización AI ya iniciada:

- El proyecto usa documentación y prompts versionados para auditorías, refactors, backlog y ejecución por agentes.
- Ya existe una estrategia basada en `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `.github/prompts/*.prompt.md`, `.github/agents/*.agent.md` y `.github/skills/*`.
- El plugin expone o puede exponer surfaces útiles para IA: architecture map, testing docs, runtime stats, KnowledgeBase read models, reports, diagnostics explainability, safe edit planning, impact analysis y context bundles.
- Los Bloques 1–9 crean contratos de serving, semantic query, ViewModels, DataWindow fast context, boundaries y testing gates que deben ser consumidos por IA sin bypass ni mutación accidental.
- El riesgo principal es que agentes o tools accedan a internals, dupliquen reglas, generen cambios sin tests/docs, ejecuten refactors enormes, o creen prompts/instructions redundantes que aumenten tokens y contradicciones.

Patrones externos aplicados:

- **Custom instructions para reglas permanentes:** reglas de proyecto y convenciones deben vivir en instrucciones automáticas, no repetirse en cada prompt.
- **Prompt files para tareas repetibles:** auditorías, refactors y cierres de specs deben vivir como `.prompt.md` invocables bajo demanda.
- **Custom agents para perfiles persistentes:** reviewer, implementer, planner, docs y release deben tener responsabilidades y tool boundaries claras.
- **Skills/tools para capacidades reutilizables:** capacidades como PowerBuilder semantics, DataWindow analysis, testing validation o performance hotpath deben ser portables y no duplicar instrucciones globales.
- **Language Model Tools / MCP con aprobación:** tools deben exponer capacidades especializadas y controladas; el usuario/host mantiene control y approvals.
- **Read-only first:** IA debe consumir contratos públicos/read-only por defecto; edición write-enabled requiere safe-edit-plan, impact-analysis, receipts y rollback.

---

## Dependencia de Bloques previos

Este bloque depende especialmente de:

- `SEMANTIC-FACADE-01` — Fachada read-only de queries semánticas.
- `PRESENTATION-06` — AI-readable presentation models sin acceso a internals.
- `TEST-STRATEGY-01` — Test matrix canónica y lanes oficiales.
- `ARCH-BOUNDARY-01` y `ARCH-GUARD-01` — Boundaries y import guards.
- `TEST-DOCS-01` — Docs drift y backlog/current-focus/done-log consistency.

Si estas piezas no existen todavía, este bloque debe definir contratos y prompts, pero no debe implementar tools que accedan a internals sin fachada pública.

---

## Estado de ítems anteriores

### Relacionados / consolidados

- Los documentos AI/agents/prompts previos quedan gobernados por este bloque.
- Nuevos agents/skills/prompts no deben duplicar reglas ya existentes en `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*` o docs AI.
- Cualquier tool IA write-enabled queda bloqueada hasta que existan safe-edit-plan, impact-analysis, receipts y rollback.

---

## Cadena recomendada — Bloque 10

Orden recomendado dentro del bloque:

1. `AI-GOV-01` — AI customization map y single source of truth.
2. `AI-INSTR-01` — Instrucciones permanentes LEAN y no duplicadas.
3. `AI-PROMPT-01` — Prompt files contract y self-check pattern.
4. `AI-AGENT-01` — Custom agents lean con responsabilidades y handoffs.
5. `AI-SKILL-01` — Skills/capabilities por dominio sin duplicar docs.
6. `AI-CONTRACT-01` — Public read-only contracts para AI consumers.
7. `AI-CONTEXT-01` — Context bundles con confidence/evidence/sourceOrigin.
8. `AI-TOOLS-01` — VS Code Language Model tools / MCP readiness policy.
9. `AI-SAFEEDIT-01` — Safe edit plan, impact analysis, receipts y rollback.
10. `AI-VALIDATION-01` — Agent validation checklist y no-close-before-green.
11. `AI-DOCS-01` — AI docs drift, token budget y maintenance policy.
12. `AI-SECURITY-01` — Tool permissions, workspace trust y data exposure guardrails.

---

# FASE A — Gobernanza e instrucciones

## AI-GOV-01 — AI customization map y single source of truth

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, governance, documentation, maintainability.
- **Problem:**
  - El proyecto puede acumular `AGENTS.md`, copilot instructions, prompt files, agents, skills y docs AI con reglas repetidas o contradictorias.
  - La IA pierde calidad cuando el contexto es largo, redundante o inconsistente.
- **Goal:**
  - Definir un mapa canónico de personalizaciones AI y responsabilidades de cada archivo/carpeta.
- **Acceptance criteria:**
  - Existe un documento o sección canónica que explica:
    - `.github/copilot-instructions.md` para reglas globales always-on;
    - `.github/instructions/*.instructions.md` para reglas por dominio/path;
    - `.github/prompts/*.prompt.md` para tareas repetibles;
    - `.github/agents/*.agent.md` para perfiles persistentes;
    - `.github/skills/*` para capacidades reutilizables;
    - `docs/ai-*` para documentación conceptual/proceso;
    - `AGENTS.md` si se mantiene, como root contract compatible con otros agentes.
  - No hay dos archivos con la misma responsabilidad primaria.
  - Cada archivo AI tiene owner, scope, cuándo usarlo y cuándo no usarlo.
  - Backlog/current-focus indican qué prompts están activos o recomendados sin duplicar contenido.
  - Docs drift valida referencias básicas a prompts/agents/instructions si existe tooling.
- **Implementation notes:**
  - No mover todos los archivos en esta spec salvo reorganización documental segura.
  - Empezar por inventario y mapa.
  - Mantener estructura LEAN para ahorro de tokens.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/ai-orchestration.md` o equivalente.
  - `docs/backlog.md`
  - `.github/copilot-instructions.md`
  - `AGENTS.md` si aplica.
- **Dependencies:** ninguna dura.
- **Risk:** medio; demasiada gobernanza puede hacer los prompts más largos y menos útiles.
- **Exit criteria:**
  - El repo tiene un mapa claro de dónde vive cada regla AI y no hay duplicación estructural evidente.

---

## AI-INSTR-01 — Instrucciones permanentes LEAN y no duplicadas

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, instructions, token-budget.
- **Problem:**
  - Las instrucciones always-on deben ser cortas, estables y críticas; si contienen demasiado detalle, consumen tokens y pueden contradecir prompts específicos.
- **Goal:**
  - Rehacer o validar instrucciones permanentes para que sean LEAN, accionables y sin duplicación.
- **Acceptance criteria:**
  - `.github/copilot-instructions.md` contiene solo reglas globales indispensables:
    - objetivo del plugin;
    - meta maestra de rendimiento;
    - arquitectura client/server/LSP;
    - documentación obligatoria;
    - testing obligatorio;
    - no big-bang refactor;
    - no inventar arquitectura;
    - PowerBuilder/DataWindow boundaries esenciales;
    - no `plugin_old` como runtime.
  - `.github/instructions/*.instructions.md` solo contiene reglas path/domain-specific.
  - No se repiten largas secciones de backlog o arquitectura en instrucciones always-on.
  - Las instrucciones enlazan docs canónicos en vez de copiarlos.
  - AGENTS.md, si existe, no contradice copilot instructions.
- **Implementation notes:**
  - Preferir bullets cortos e imperativos.
  - Mover checklists largos a prompt files o docs.
  - Evitar reglas temporales en always-on.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `.github/copilot-instructions.md`
  - `.github/instructions/*.instructions.md`
  - `AGENTS.md` si aplica.
  - `docs/ai-orchestration.md` o equivalente.
- **Dependencies:** `AI-GOV-01`.
- **Risk:** medio; instrucciones demasiado breves pueden perder contexto crítico, demasiado largas reducen calidad.
- **Exit criteria:**
  - Instrucciones permanentes quedan LEAN, no duplicadas y alineadas con docs canónicos.

---

## AI-PROMPT-01 — Prompt files contract y self-check pattern

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, prompts, workflow, quality-gates.
- **Problem:**
  - Auditorías/refactors largos pueden quedarse a mitad si el prompt no define fases, acceptance criteria y self-check final.
- **Goal:**
  - Establecer contrato común para `.github/prompts/*.prompt.md` y patrón de ejecución con revisión final repetida.
- **Acceptance criteria:**
  - Todo prompt ejecutable usa extensión `.prompt.md`.
  - Cada prompt incluye:
    - objetivo;
    - alcance;
    - fuera de alcance;
    - reglas duras;
    - fases;
    - criterios de aceptación;
    - tests/docs obligatorios;
    - self-check final;
    - resultado final obligatorio.
  - Los prompts largos no duplican instrucciones globales; enlazan docs/instructions cuando sea posible.
  - Los prompts de refactor incluyen “no big-bang” y “no preguntar/no parar” si procede.
  - Existe un prompt corto genérico para ejecutar prompt files con self-check.
  - Docs explican cuándo usar prompt file vs instructions vs agent vs skill.
- **Implementation notes:**
  - Consolidar prompts existentes sin borrar historial útil.
  - Renombrar `.md` ejecutables a `.prompt.md` si aplica.
  - Mantener prompts por tarea, no mega-prompt único.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid` si hay guard de naming.
- **Docs:**
  - `.github/prompts/*.prompt.md`
  - `docs/ai-orchestration.md`
  - `docs/testing.md`
- **Dependencies:** `AI-GOV-01`.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Prompt files quedan estandarizados y preparados para tareas largas sin cierres falsos.

---

# FASE B — Agents, skills y contratos de consumo

## AI-AGENT-01 — Custom agents lean con responsabilidades y handoffs

- **Priority:** P2.
- **Status:** Open.
- **Area:** AI, agents, orchestration.
- **Problem:**
  - Demasiados agentes o agentes muy largos pueden duplicar instrucciones y generar decisiones inconsistentes.
- **Goal:**
  - Definir un set mínimo de agents con responsabilidades claras y handoffs entre ellos.
- **Acceptance criteria:**
  - Existe set mínimo recomendado, por ejemplo:
    - planner;
    - implementer;
    - reviewer;
    - docs;
    - testing;
    - release.
  - Cada agent tiene:
    - misión;
    - scope;
    - no debe hacer;
    - docs que debe leer;
    - tests mínimos;
    - handoffs.
  - Agents no duplican copilot instructions ni prompts largos.
  - Agents no abren features fuera de current-focus/backlog.
  - Reviewer no implementa salvo fixes pequeños autorizados.
  - Release no cambia arquitectura.
- **Implementation notes:**
  - Menos agentes, mejor definidos.
  - Si un agente necesita capacidades complejas, usar skill/prompt, no meter todo en agent.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `.github/agents/*.agent.md`
  - `docs/ai-orchestration.md`
- **Dependencies:**
  - `AI-GOV-01`
  - `AI-INSTR-01`
- **Risk:** medio; agentes solapados pueden aumentar ruido.
- **Exit criteria:**
  - Agents quedan lean, no duplicados y útiles para el flujo real del repo.

---

## AI-SKILL-01 — Skills/capabilities por dominio sin duplicar docs

- **Priority:** P2.
- **Status:** Open.
- **Area:** AI, skills, domain-capabilities.
- **Problem:**
  - PowerBuilder semantics, DataWindow analysis, testing validation, performance hotpath y docs governance requieren capacidades especializadas reutilizables.
  - Si se meten en instrucciones globales, aumentan tokens y duplican docs.
- **Goal:**
  - Definir skills/capabilities por dominio, con recursos mínimos y referencias a docs canónicos.
- **Acceptance criteria:**
  - Skills recomendadas existen o quedan planificadas:
    - `powerbuilder-semantics`;
    - `datawindow-analysis`;
    - `performance-hotpath`;
    - `testing-validation`;
    - `docs-governance`;
    - `build-release`;
    - `official-research`.
  - Cada skill incluye propósito, cuándo activarse, recursos, límites y output esperado.
  - Skills no duplican documentación técnica extensa; enlazan docs canónicos.
  - Skills no dan permiso implícito a cambios write-enabled.
- **Implementation notes:**
  - Crear solo skills que se usen realmente.
  - Evitar skills demasiado amplias.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `.github/skills/*/SKILL.md`
  - `docs/ai-orchestration.md`
- **Dependencies:** `AI-GOV-01`.
- **Risk:** medio.
- **Exit criteria:**
  - Capacidades AI quedan modularizadas sin inflar instrucciones globales.

---

## AI-CONTRACT-01 — Public read-only contracts para AI consumers

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, public-api, architecture, read-only.
- **Problem:**
  - IA/tools pueden querer leer semántica, diagnostics, runtime stats o reports. Si acceden a internals, pueden romper boundaries o duplicar lógica.
- **Goal:**
  - Definir contratos públicos/read-only para consumidores IA.
- **Acceptance criteria:**
  - Existen contratos read-only para:
    - architecture/status summary;
    - test matrix/status;
    - semantic query facade outputs;
    - diagnostics/explainability;
    - runtime/performance stats;
    - DataWindow high-confidence context;
    - presentation/read models;
    - backlog/current-focus metadata.
  - AI consumers no leen internals de parser, KnowledgeBase, caches o DataWindowModel si existe contrato público.
  - Contratos incluyen confidence, reasonCodes, sourceOrigin y freshness cuando aplique.
  - Contratos son serializables y con payload budget.
  - No hay mutación de estado core desde estos contracts.
- **Implementation notes:**
  - Empezar con interfaces/types y adapters read-only.
  - No crear API pública externa hasta tener consumidores reales.
  - No exponer datos enormes sin caps/pagination.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/ai-orchestration.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
  - `PRESENTATION-06`
  - `TEST-STRATEGY-01`
- **Risk:** alto; exponer contratos demasiado amplios puede congelar internals o aumentar payload.
- **Exit criteria:**
  - IA tiene surfaces read-only claras y no necesita saltarse internals.

---

## AI-CONTEXT-01 — Context bundles con confidence/evidence/sourceOrigin

- **Priority:** P2.
- **Status:** Open.
- **Area:** AI, context-bundles, explainability.
- **Problem:**
  - Para que IA ayude con refactors, diagnostics o explicación semántica, necesita contexto fiable, compacto y trazable.
- **Goal:**
  - Definir context bundles compactos y agent-ready con confidence/evidence/sourceOrigin.
- **Acceptance criteria:**
  - Existen context bundles para:
    - current file/object;
    - symbol target;
    - callable/function/event;
    - DataWindow context;
    - diagnostics explanation;
    - performance/hotpath stats;
    - spec/backlog context.
  - Cada bundle incluye freshness/version, sourceOrigin, confidence y reasonCodes cuando aplique.
  - Bundles tienen caps y no incluyen dumps completos del workspace.
  - Bundles son read-only y no contienen secretos ni paths sensibles innecesarios.
  - Tests cubren shape, caps y no-internals leakage.
- **Implementation notes:**
  - Reutilizar ViewModels/read models del Bloque 7.
  - Mantener bundles pequeños y específicos.
  - Separar UI bundles de AI bundles si sus necesidades divergen.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:performance:gate` si hay payload budget.
- **Docs:**
  - `docs/ai-orchestration.md`
  - `docs/performance-budget.md`
  - `docs/testing.md`
- **Dependencies:**
  - `AI-CONTRACT-01`
  - `PRESENTATION-06`
- **Risk:** medio-alto.
- **Exit criteria:**
  - IA puede pedir contexto compacto, trazable y seguro sin acceder a internals.

---

# FASE C — Tools, MCP y safe edit

## AI-TOOLS-01 — VS Code Language Model tools / MCP readiness policy

- **Priority:** P2.
- **Status:** Open.
- **Area:** AI, tools, MCP, VS Code API.
- **Problem:**
  - VS Code permite extension tools y MCP tools, pero exponer herramientas sin política puede abrir riesgos de seguridad, permisos, payload o mutación accidental.
- **Goal:**
  - Definir cuándo usar extension Language Model Tools, chat participants o MCP servers para el plugin.
- **Acceptance criteria:**
  - Se documenta decisión entre:
    - prompt files;
    - custom agents;
    - skills;
    - extension LM tools;
    - chat participant;
    - MCP server.
  - Tools iniciales, si se implementan, son read-only:
    - get architecture summary;
    - get current symbol context;
    - get diagnostics explanation;
    - get performance stats;
    - get DataWindow context high-confidence.
  - Cada tool tiene JSON schema/input contract, caps y output payload budget.
  - Tools write-enabled quedan bloqueadas hasta `AI-SAFEEDIT-01`.
  - Workspace Trust y approval requirements quedan documentados.
  - No se añaden MCP servers de workspace sin decisión explícita y revisión de seguridad.
- **Implementation notes:**
  - No implementar tools si aún no hay public read-only contracts.
  - Preferir extension tools para integración VS Code/local del plugin; MCP solo si se necesita portabilidad fuera de VS Code.
  - Toda tool debe ser observable y testeable.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/ai-orchestration.md`
  - `docs/architecture-implementation-map.md`
  - `.vscode/mcp.json` solo si aplica.
- **Dependencies:**
  - `AI-CONTRACT-01`
  - `AI-CONTEXT-01`
- **Risk:** alto; tools mal diseñadas pueden exponer datos o ejecutar acciones no deseadas.
- **Exit criteria:**
  - Existe política clara para tools/MCP/chat participants y solo read-only queda permitido inicialmente.

---

## AI-SAFEEDIT-01 — Safe edit plan, impact analysis, receipts y rollback

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, safe-edit, automation, write-enabled.
- **Problem:**
  - Automatización write-enabled avanzada puede modificar código, specs, docs o configuración sin trazabilidad suficiente.
- **Goal:**
  - Definir contrato obligatorio para cualquier tool/agent que haga cambios write-enabled.
- **Acceptance criteria:**
  - Todo flujo write-enabled requiere:
    - safe-edit-plan previo;
    - lista de archivos afectados;
    - impact analysis;
    - tests/docs esperados;
    - receipts de cambios;
    - rollback strategy o revert instructions;
    - final self-check.
  - No se permite write-enabled sobre parser/KnowledgeBase/DataWindowModel/build rails sin spec explícita.
  - No se permite modificar generated catalog salvo spec que lo autorice.
  - Cambios de docs/backlog/current-focus/done-log siguen reglas oficiales.
  - Tools write-enabled requieren approval explícito y no se ejecutan por defecto.
- **Implementation notes:**
  - Este contrato puede existir primero como prompt/checklist antes de tools reales.
  - Integrar con prompts de refactor y spec closure.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/ai-orchestration.md`
  - `.github/prompts/refactor-*.prompt.md` si aplica.
  - `.github/agents/*.agent.md`
- **Dependencies:**
  - `TEST-STRATEGY-01`
  - `AI-PROMPT-01`
- **Risk:** alto.
- **Exit criteria:**
  - Ningún flujo AI write-enabled queda sin plan, impacto, receipts y rollback.

---

## AI-VALIDATION-01 — Agent validation checklist y no-close-before-green

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, validation, process.
- **Problem:**
  - Agentes pueden cerrar specs sin ejecutar validaciones reales, sin actualizar docs o sin revisar el prompt original.
- **Goal:**
  - Definir checklist obligatorio antes de que un agente cierre cualquier spec/auditoría/refactor.
- **Acceptance criteria:**
  - Checklist incluye:
    - releer spec/prompt original;
    - verificar acceptance criteria;
    - revisar código cambiado;
    - ejecutar scripts reales aplicables;
    - documentar scripts missing/failing;
    - actualizar docs/backlog/current-focus/done-log según reglas;
    - registrar hallazgos no resueltos en backlog;
    - self-check final repetido hasta cero pendientes o bloqueos justificados.
  - El checklist está en instrucciones/prompts adecuados, no duplicado en todos los docs.
  - Los agentes no pueden marcar `Done` sin validación y done-log.
  - Si una validación no puede ejecutarse, el resultado final debe indicar causa y riesgo.
- **Implementation notes:**
  - Reutilizar checklist final del backlog actual.
  - Añadir versión corta para prompts de ejecución.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/ai-orchestration.md`
  - `.github/prompts/*.prompt.md`
  - `.github/agents/*.agent.md`
  - `docs/backlog.md`
- **Dependencies:**
  - `TEST-STRATEGY-01`
  - `AI-PROMPT-01`
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Cierre por agente queda gobernado por checklist único y verificable.

---

# FASE D — Docs, tokens y seguridad

## AI-DOCS-01 — AI docs drift, token budget y maintenance policy

- **Priority:** P2.
- **Status:** Open.
- **Area:** AI, docs, token-budget, maintainability.
- **Problem:**
  - AI docs, prompts, agents, instructions y skills pueden crecer indefinidamente y generar duplicidad.
- **Goal:**
  - Mantener la documentación AI lean, versionada y alineada con el resto del repo.
- **Acceptance criteria:**
  - Existe política de token budget para instructions/prompts/agents.
  - Prompts largos viven en `.github/prompts`, no en instrucciones always-on.
  - Docs AI enlazan a arquitectura/backlog/testing en vez de duplicarlos.
  - `test:docs:drift` o checklist detecta referencias rotas o prompts obsoletos.
  - Cada nuevo prompt/agent/skill debe justificar owner, scope y no-duplicación.
  - Se documenta proceso para retirar prompts/agents obsoletos.
- **Implementation notes:**
  - Usar naming consistente.
  - Mantener “prompt catalog” breve.
  - No convertir docs AI en copia del backlog.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/ai-orchestration.md`
  - `.github/prompts/*`
  - `.github/agents/*`
  - `.github/skills/*`
- **Dependencies:**
  - `AI-GOV-01`
- **Risk:** bajo-medio.
- **Exit criteria:**
  - AI docs quedan mantenibles, lean y sin duplicación innecesaria.

---

## AI-SECURITY-01 — Tool permissions, workspace trust y data exposure guardrails

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, security, workspace-trust, permissions.
- **Problem:**
  - Tools/agents pueden exponer datos del workspace, ejecutar comandos o modificar archivos si no hay guardrails.
- **Goal:**
  - Definir política de seguridad para herramientas IA, MCP, workspace trust, approvals y exposición de datos.
- **Acceptance criteria:**
  - Tools read-only y write-enabled están separadas.
  - Write-enabled requiere aprobación explícita y `AI-SAFEEDIT-01`.
  - MCP servers de workspace requieren revisión de seguridad y trusted source.
  - No se exponen secrets, tokens, rutas sensibles o dumps masivos en context bundles.
  - Workspace Trust / Restricted Mode se respeta para build/ORCA/external commands/tools.
  - Tools que ejecuten comandos externos quedan bloqueadas salvo spec explícita.
  - Docs explican riesgos y permisos.
- **Implementation notes:**
  - No añadir herramientas externas por defecto.
  - Mantener allowlist de tools si se implementan.
  - Preferir user approval para acciones sensibles.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/ai-orchestration.md`
  - `docs/developer-workflows.md` si aplica.
  - `.vscode/mcp.json` si aplica.
- **Dependencies:**
  - `AI-TOOLS-01`
  - `AI-SAFEEDIT-01`
- **Risk:** alto.
- **Exit criteria:**
  - Herramientas IA y MCP tienen permisos, trust y exposición de datos bajo control.

---

## Resultado esperado al cerrar el Bloque 10

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Existe mapa canónico de AI customizations y single source of truth.
2. Instrucciones permanentes son LEAN y no duplican prompts/docs.
3. Prompt files tienen contrato estándar con fases, acceptance criteria y self-check.
4. Agents son pocos, claros, con responsabilidades y handoffs.
5. Skills/capabilities son modulares y no duplican documentación canónica.
6. AI consumers usan public read-only contracts, no internals.
7. Context bundles son compactos, trazables y con confidence/evidence/sourceOrigin.
8. Tools/MCP/chat participant tienen política clara y read-only-first.
9. Write-enabled AI requiere safe-edit-plan, impact-analysis, receipts y rollback.
10. Agent validation checklist impide cierres falsos.
11. AI docs tienen token budget y drift policy.
12. Tool permissions, workspace trust y data exposure quedan gobernados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — AI Tools, Agents, Prompts & Public Contracts

## Scope

- AI-GOV-01
- AI-INSTR-01
- AI-PROMPT-01
- AI-VALIDATION-01

## Optional within same focus only if previous items are closed

- AI-AGENT-01
- AI-SKILL-01
- AI-DOCS-01

## Explicitly out of scope

- Implementing write-enabled tools
- Adding MCP servers by default
- New semantic APIs beyond read-only contracts
- New AI tools that bypass SemanticQueryFacade/ViewModels
- Large prompt rewrites without token-budget review
- Duplicating backlog or architecture docs inside instructions

## Exit criteria

- AI customization map exists.
- Instructions/prompts/agents are lean and non-overlapping.
- Prompt files have self-check contract.
- Agent close checklist is explicit and aligned with tests/docs.
```

---
