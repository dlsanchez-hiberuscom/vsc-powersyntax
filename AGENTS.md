# AGENTS.md — PowerBuilder VS Code Plugin

Reglas obligatorias para cualquier IA, Copilot Agent o automatización que trabaje en este repositorio.

## 1. Meta maestra

> El plugin debe descubrir e indexar muy rápido sin bloquear.

Todo cambio debe proteger activación rápida, cliente VS Code ligero, servidor LSP como runtime principal, prioridad al archivo activo, hot path sin scans completos, semántica compartida, `sourceOrigin`, `readiness`, `evidence`, `confidence` y documentación viva.

## 2. Orden de lectura obligatorio

```txt
1. docs/constitution.md
2. docs/current-focus.md
3. docs/backlog.md
4. specs/<spec-activa>/spec.md
5. specs/<spec-activa>/tasks.md
6. specs/<spec-activa>/plan.md
7. docs/architecture.md
8. docs/architecture-status.md
9. Documento propietario del área tocada
10. docs/testing.md
11. docs/performance-budget.md si toca runtime/hot path/performance
```

`docs/done-log.md` es histórico. No usarlo como foco activo.

## 3. Autoridad documental

```txt
1. docs/constitution.md
2. docs/architecture.md
3. specs aprobadas en specs/
4. docs/architecture-status.md
5. docs/current-focus.md
6. docs/backlog.md
7. docs/roadmap.md
8. docs/done-log.md
9. implementación actual
```

## 4. Reglas obligatorias

La IA debe respetar foco activo, ejecutar specs en orden, no abrir trabajo fuera de foco, no cerrar sin validación, actualizar documentación afectada, registrar deuda nueva, mantener tests verdes y dejar evidencia.

La IA no debe inventar features, saltarse dependencias, cerrar en parcial, ocultar fallos, fingir validaciones, mover a `Done` sin evidencia, modificar IDs generated/manual sin autorización, introducir scans completos en hot path, clonar catálogo completo en serving, parsear `.srd` como PowerScript ni tratar `.pbl/.pbd` como source editable.

## 5. Definition of Done

```txt
1. Código implementado o decisión no-action documentada.
2. Tests/validación ejecutados.
3. Documentación afectada actualizada.
4. Backlog/current-focus/roadmap alineados.
5. Done-log actualizado solo si el cierre es real.
6. Sin deuda crítica oculta.
7. Sin regresión de performance/hot path.
8. Sin contradicción documental.
```

## 6. Validación mínima

```bash
npm test
npm run test:docs:drift
npm run test:architecture:metrics
npm run test:performance:gate
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
npm run release:verify
```

Si un comando no existe o no puede ejecutarse, documentar comando, motivo, impacto y follow-up. No marcar OK.

## 7. Hot path guardrails

Prohibido: workspace scans completos, full catalog clone, `JSON.stringify` masivo, reread global de archivos, reparsing global por feature, DataWindow parsing como PowerScript, ORCA/PBAutoBuild execution, reports pesados sin caps y payloads agent-ready sin budget.

Obligatorio: queries acotadas, result caps, readiness gates, confidence, sourceOrigin, cancellation/yielding, serving cache cuando aplique y degradación honesta.

## 8. Reglas PowerBuilder críticas

- DataWindow `.srd` es sublenguaje, no PowerScript.
- PBL/PBD binarios no son source editable.
- ORCA staging no gana a source real.
- Generated no habilita escritura directa.
- Rename/code actions requieren `sourceOrigin` confiable.
- Dynamic calls, strings dinámicos, external DLL/PBX y RPCFUNC degradan confidence.
- SetTrans y SetTransObject no son equivalentes.
- SQL embebido y dynamic SQL deben degradar si no son defendibles.

## 9. Documentos propietarios

```txt
Arquitectura estable: docs/architecture.md
Estado implementado: docs/architecture-status.md
Trabajo pendiente: docs/backlog.md
Foco activo: docs/current-focus.md
Histórico: docs/done-log.md
Contexto IA corto: docs/ai-context/powerbuilder-plugin-context.md
Testing: docs/testing.md
Performance: docs/performance-budget.md
Workflows usuario: docs/developer-workflows.md
Catálogo: docs/catalog/system-catalog-architecture.md
IA/tools: docs/ai/ai-integration-architecture.md
Agentes: docs/ai/ai-agents-catalog.md
Build/VSIX/ORCA/PBAutoBuild: docs/build/README.md y docs/build/orca-pbautobuild-architecture.md
Reglas/diagnósticos: docs/rules/rules-catalog.md
```

## 10. Salida obligatoria

```markdown
# Resultado
## Trabajo realizado
## Specs procesadas
## Código modificado
## Docs modificadas
## Tests ejecutados
## Pendiente
## Backlog/follow-up
## Git
## Siguiente foco
```
