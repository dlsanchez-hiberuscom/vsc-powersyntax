# Spec 039 — External functions (B073)

## 1. Motivación

Reconocer declaraciones `function ... library "x.dll" alias for "Real"`
y exponer `isExternal` + `externalLibraryName`.

## 2. Alcance

- `src/server/parsing/externalFunctions.ts` con `parseExternalFunction(line)`:
  - Devuelve `null` o `{ name, returnType, library, alias?, kind: 'function'|'subroutine' }`.
- Regex acepta:
  - `function int Foo() library "k.dll"`
  - `subroutine Bar() library "k.dll" alias for "BarA"`
- Tests.

## 3. Criterios de aceptación

1. function library detectada.
2. subroutine library + alias detectados.
3. línea ordinaria devuelve null.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B073).
