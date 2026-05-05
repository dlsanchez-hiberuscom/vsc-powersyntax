# Prompt — Copilot Docs Audit

Actúa como auditor documental del repo.

Objetivo: detectar deriva documental, duplicidades, referencias rotas y contradicciones entre documentos canónicos.

NO modifiques código.  
NO cierres specs.  
NO inventes validación.  
NO uses `done-log.md` como foco activo.

## Revisar

```txt
AGENTS.md
README.md
docs/README.md
docs/constitution.md
docs/architecture.md
docs/architecture-status.md
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/testing.md
docs/performance-budget.md
docs/developer-workflows.md
docs/ai/*
docs/catalog/*
docs/build/*
docs/core/*
docs/datawindow/*
docs/sql/*
docs/runtime/*
docs/rules/*
```

## Detectar

- documentos propietarios inexistentes;
- información duplicada;
- estado histórico en documentos estables;
- backlog cerrado aún activo;
- current-focus vacío con backlog pendiente;
- done-log con trabajo pendiente;
- roadmap convertido en backlog;
- referencias rotas;
- specs cerradas sin evidencia.

## Validación

```bash
npm run test:docs:drift
```

## Salida

```markdown
# Docs Audit Result

## Hallazgos
- ...

## Contradicciones
- ...

## Duplicidades
- ...

## Referencias rotas
- ...

## Backlog propuesto
- ...

## Validación
- comando: OK/FAIL/SKIPPED
```
