# AI Integration Architecture — PowerBuilder VS Code Plugin

## 1. Propósito

Definir la arquitectura de integración IA del plugin PowerBuilder para VS Code.

Este documento describe **cómo la IA consume conocimiento del plugin** mediante contratos públicos, tools, context bundles y receipts. No define estrategia general ni catálogo de agentes.

Documentos relacionados:

- `AGENTS.md` — reglas operativas raíz para agentes.
- `docs/ai/ai-strategy.md` — visión estratégica IA.
- `docs/ai/ai-agents-catalog.md` — catálogo de agentes.
- `docs/ai-context/powerbuilder-plugin-context.md` — contexto corto para prompts.
- `docs/architecture.md` — arquitectura estable.
- `docs/architecture-status.md` — estado implementado.

---

## 2. Principio base

La IA consume **contratos públicos**, no estructuras internas del dominio.

Reglas:

- La IA no accede directamente a `core/domain`, `knowledge` ni estructuras mutables internas.
- Toda integración IA pasa por API pública, LSP, JSON-RPC/tool bridge o context packs versionados.
- Las tools read-only no modifican código ni estado persistente sensible.
- Las tools write-enabled requieren safe-edit-plan, impact-analysis, preflight, receipts y validación.
- El plugin debe funcionar completamente sin IA.

---

## 3. Superficies de integración

### 3.1 API pública versionada

La API pública es la superficie estable para consumidores externos y herramientas IA.

Debe exponer:

- descriptor de versión;
- inventario de métodos;
- schemas de entrada/salida;
- capabilities;
- contratos de observabilidad;
- límites de seguridad;
- compatibilidad y deprecations.

### 3.2 JSON-RPC / Tool bridge

El bridge permite invocar tools mediante nombres estables y payloads tipados.

Reglas:

- No usar acceso ad hoc al host.
- No devolver estructuras internas mutables.
- Todo payload debe ser serializable, versionado y acotado.
- Toda respuesta debe incluir readiness/confidence/reasonCodes cuando aplique.

### 3.3 VS Code Language Model API / Chat tools

Si se usan Chat Participants o Tools de VS Code, deben consumir la misma API pública.

Reglas:

- No abrir un segundo motor semántico para Copilot.
- No mandar código bruto por defecto.
- No romper privacidad local.
- No saltar budgets ni caps.

### 3.4 MCP futuro

Si se expone MCP, debe montarse como adapter sobre los mismos contratos públicos.

MCP no debe introducir:

- nuevo modelo semántico;
- duplicidad de tools;
- acceso directo al core;
- formatos no versionados.

---

## 4. Tools read-only

Tools read-only permitidas:

```txt
contract
workspace-check
object-check
explain-diagnostic
explain-system-symbol
explain-semantic-query
ai-task-context-bundle
server-stats
query-symbols
cross-project-symbol-conflicts
workspace-migration-assistant
build-profile-matrix
dependency-graph
code-metrics
technical-debt-report
datawindow-sql-lineage
current-object-context
impact-analysis
safe-edit-plan
safe-batch-refactor-plan
semantic-snapshot-diff
semantic-workspace-manifest
```

Reglas:

- No modifican archivos.
- No ejecutan ORCA/PBAutoBuild en hot path.
- No reparsean workspace completo.
- No duplican semántica.
- Deben degradar con reasonCodes si falta contexto.
- Deben aplicar caps, paginación u omissions cuando el payload sea grande.

---

## 5. Workflows write-enabled

Workflows write-enabled permitidos solo bajo contrato explícito:

```txt
applySpecDrivenPblUpdate
applySpecDrivenPblUpdateBatch
safe code actions
safe batch refactor planning + apply explícito
```

Requisitos obligatorios:

1. spec activa;
2. sourceOrigin confiable;
3. impact analysis;
4. safe edit plan;
5. preflight;
6. backup/ledger/journal si toca PBL/ORCA staging;
7. validationReceipt;
8. docsTouched/docsPending/specsAffected;
9. tests/validación;
10. actualización documental.

---

## 6. Context bundles

Los context bundles existen para evitar prompts gigantes y contexto manual desordenado.

Tipos:

- `ai-task-context-bundle` — contexto compacto para una tarea viva.
- `semantic-repro-pack` — repro semántico con archivos relacionados cuando sea necesario.
- `support-bundle` — observabilidad offline saneada, sin código bruto por defecto.
- `task-replay-bundle` — rehidratación de contexto desde bundle exportado.

Reglas:

- Incluir omissions explícitas.
- Incluir reasonCodes.
- Incluir receipts de paginación si aplica.
- Redactar rutas, URIs, ejecutables y datos sensibles según perfil.
- No exportar código bruto salvo carril explícito de repro.

---

## 7. Privacidad y seguridad

- `externalTelemetry = false` por defecto.
- Export offline solo por acción explícita del usuario.
- Support bundles saneados por defecto.
- Secrets, tokens, rutas privadas y endpoints sensibles deben redactarse.
- No enviar datos a proveedores externos sin consentimiento/configuración explícita.

---

## 8. Relación con arquitectura

La integración IA debe respetar:

- cliente mínimo;
- servidor LSP como runtime principal;
- core agnóstico;
- features como adaptadores finos;
- UX sobre contratos públicos;
- sourceOrigin/readiness/evidence/confidence;
- hot path sin scans completos;
- DataWindow como sublenguaje.

---

## 9. Validación

Cambios en esta arquitectura deben validar, según alcance:

```bash
npm run test:docs:drift
npm test
npm run test:architecture:metrics
npm run test:performance:gate
npm run test:smoke:installed-vsix
```

Si cambia API pública/tool bridge, añadir tests contractuales específicos.

---

## 10. Regla final

La IA amplifica el conocimiento del plugin. No sustituye al motor semántico, no accede al core interno y no ejecuta cambios sin contratos, validación y evidencia.
