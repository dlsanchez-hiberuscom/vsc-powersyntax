# Spec 396 — B302 Agent-safe documentation updater policy

## Estado

- done

## Relacion backlog

- Backlog item: `B302 — Agent-safe documentation updater policy`

## Objetivo

Evitar que agentes dupliquen documentacion, marquen como implementado lo que no existe o cierren trabajo con documentos propietarios pendientes.

## Resultado de cierre

- los prompts `.github/agents/docs-updater.agent.md` y `.github/agents/docs-auditor.agent.md` quedan cubiertos por tests que fijan ownership documental y prohiben actualizaciones ciegas;
- `docs/ai-context/powerbuilder-plugin-context.md` deja el foco vivo delegado a `docs/current-focus.md` y no conserva estado IA historico desalineado;
- la documentacion canónica del carril IA incorpora `docsPending`, `docsTouched` y cierre condicionado por el receipt, de modo que la policy ya no depende solo del prompt real;
- `test/server/unit/agentDocsPolicy.test.ts` valida ownership y foco vivo sobre archivos reales del repo.

## Validacion ejecutada

- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

## Fuera de alcance del corte cerrado

- crear un motor automatico de merge documental;
- permitir cierres de backlog saltandose documentos propietarios;
- convertir prompts de agentes en sustituto de la documentacion canonica.