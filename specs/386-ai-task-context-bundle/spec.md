# Spec 386 — B381 AI task context bundle orchestration tool

## Estado

- done

## Relacion backlog

- Backlog item: `B381 — AI task context bundle orchestration tool`

## Objetivo

Exponer un bundle read-only compacto para tareas IA concretas, reutilizando surfaces ya cerradas (`workspace-check`, `object-check`, `currentObjectContext`, `safeEditPlan`, `dependencyGraph`, `explain-diagnostic`, `explain-system-symbol`) sin duplicar serving ni abrir contexto masivo al prompt.

## Alcance

- definir request/report contractuales del bundle;
- componer el bundle sobre surfaces ya publicadas;
- respetar un budget de tokens con `omissions` explicitas y truncado conservador.

## Fuera de alcance

- writes, ORCA, build o side effects;
- incluir catalogos completos o archivos completos en el bundle;
- reimplementar logica semantica fuera de las surfaces read-only existentes.