# Spec: PB-SEMANTIC-P2-LEGACY-CONTROL-MATRIX-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P2-LEGACY-CONTROL-MATRIX-01
- **Título:** Confirmar o degradar labels, GOTO, precedencia y compilación condicional integrada
- **Estado:** Done
- **Prioridad:** P2
- **Área:** Semántica, Parsing

## 2. Objetivo
Formalizar el alcance del soporte del plugin para los constructs *legacy* (GOTO, labels, precedencia expresiva) y los bloqueos de compilación condicional (`#if`, `#define`), evitando la falsa promesa de soporte estructural completo.

## 3. Matriz de Soporte y Decisiones

### 3.1 Compilación Condicional
- **Decisión:** Mantenida como **Detector Gated (Read-Only)**.
- **Razón:** Integrar compilación condicional requeriría una reevaluación global del workspace en tiempo real (manejo de variables de entorno de PowerBuilder o de perfiles de compilación). 
- **Estado Actual:** El módulo `conditionalCompilationGate` continuará detectando pasivamente los marcadores, pero el parser semántico *no* mutará ni ignorará líneas en base a estas macros. Documentado explícitamente como alcance parcial en la guía técnica.

### 3.2 GOTO y Labels
- **Decisión:** Degradado a **Needs Official Confirmation (Parcial / Catálogo)**.
- **Razón:** Construir un Control Flow Graph (CFG) fiable con saltos arbitrarios es prohibitivo para el presupuesto de performance interactivo (hot path) y tiene muy bajo valor en proyectos PFC o arquitecturas limpias.
- **Estado Actual:** Los tokens `goto` están reconocidos por el lexer/catálogo para resaltado sintáctico, pero el analizador estructural y de diagnósticos no intentará verificar que el label de destino exista ni reportará scopes rotos por saltos no estructurados.

### 3.3 Precedencia Expresiva
- **Decisión:** Degradado a **Needs Official Confirmation (No AST)**.
- **Razón:** El servidor LSP no materializa un Abstract Syntax Tree de granularidad fina para cada token de la expresión matemática/lógica. Resolver la precedencia completa implica implementar un analizador de expresiones de descendencia recursiva completo, excediendo los límites funcionales de LSP (que requiere saltar a la definición y parseo de tipos).
- **Estado Actual:** No hay validación de precedencia a nivel de editor. Se relega al compilador real (PBAutoBuild).

## 4. Criterios de Aceptación
1. La documentación dueña (`docs/powerbuilder-2025-vscode-plugin-technical-guide.md`) ya delimita explícitamente que la compilación condicional es tratada mediante un detector y carece de soporte semántico completo (ver 10.11).
2. El *pipeline* del LS (`diagnostics.ts`) omite el procesamiento estructural de GOTO y Labels.
3. El backlog y esta spec actúan de límite definitivo, liberando el esfuerzo hacia tareas de valor (DataWindows y submodelos).
