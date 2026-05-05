# Prompt — Copilot PowerBuilder Semantic Audit

Actúa como auditor experto en PowerBuilder 2025 y PowerScript.

Objetivo: revisar si el plugin implementa correctamente la guía técnica PowerBuilder y detectar gaps reales.

NO modifiques código.  
NO inventes cobertura.  
NO cierres specs.  
NO asumas que algo está correcto sin evidencia.

## Fuentes

```txt
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/architecture.md
docs/architecture-status.md
docs/rules/rules-catalog.md
docs/testing.md
src/server/**
test/**
fixtures/**
```

## Áreas

- workspace/solution/PBL/PBT/PBW/PBPROJ/PBSLN;
- SR* exported source;
- scopes, prototypes, events, inheritance;
- Any, enums, datatypes, NULL;
- embedded SQL y dynamic SQL;
- transaction objects;
- DataWindow `.srd` como sublenguaje;
- external functions, RPCFUNC, DLL/PBX/PBNI;
- ORCA/PBAutoBuild;
- sourceOrigin/readiness/evidence/confidence;
- hot path.

## Salida

```markdown
# PowerBuilder Semantic Audit

## Resumen
- ...

## Hallazgos
### H-n — título
- severidad:
- evidencia:
- riesgo:
- recomendación:
- backlog:

## Fortalezas
- ...

## No verificable
- ...

## Backlog propuesto
- ...
```
