# Spec 027 — Shadowing detection (B035)

## 1. Motivación

Detectar variables locales que ocultan a una variable de instancia o
shared/global del mismo nombre, aplicando el orden real de lookup
(local → shared → global → instance). Reduce bugs sutiles y refuerza la
disciplina del código.

## 2. Alcance

- Nuevo diagnóstico `SD6` en `src/server/features/diagnostics.ts`:
  - Para cada `Scope` Function/Event, recorrer sus `symbols` locales.
  - Si el nombre coincide con una variable global (`scope === 'Global'`),
    shared (`'Compartida'`) o de instancia (`'Instancia'`) presente en
    `semanticFacts`, emitir un `Diagnostic` (Information).
  - Excluir parámetros (line === scope.startLine).
- Tests `test/server/unit/diagnostics.shadowing.test.ts` con un fixture
  sintético usando KB.

### Fuera de alcance

- Shadowing entre tipos heredados (P2).
- Shadowing en bloques anidados (loop) — usamos solo Function/Event scope.

## 3. Criterios de aceptación

1. Variable local con nombre = variable instancia → SD6.
2. Variable local con nombre = variable global → SD6.
3. Sin colisión → no se emite.

## 4. Documentación

- `docs/architecture.md`, `docs/backlog.md` (B035).
