# Spec 033 — State machine de secciones (B055)

## 1. Motivación

Reforzar la detección de secciones con una pequeña state machine
explícita y testeable, que sirva como base canónica para futuros
parsers (B113 SR* container, etc.).

## 2. Alcance

- `src/server/parsing/sectionMachine.ts`:
  - `scanSections(lines: string[]): SectionRange[]`.
  - Reconoce, en orden:
    - `forward` ... `end forward`
    - `forward prototypes` ... `end prototypes`
    - `type prototypes` ... `end prototypes`
    - `type ... variables` / `<obj> variables` ... `end variables`
  - Devuelve `SectionRange[]` con kind `'forward'|'prototypes'|'variables'`.

### Fuera de alcance

- Sustituir el detector existente (este es complementario y testeable).

## 3. Criterios de aceptación

1. Detecta `forward`/`end forward`.
2. Detecta `forward prototypes`/`end prototypes`.
3. Detecta `type variables`/`end variables`.
4. Tests cubren cada caso.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B055).
