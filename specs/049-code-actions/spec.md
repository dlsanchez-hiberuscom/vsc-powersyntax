# Spec 049 — Code actions: replace obsolete (B036)

## Motivación
Primer code action: para diagnostics SD7 con función obsoleta y
sugerencia de reemplazo, ofrecer un quick-fix automático.

## Alcance
- `src/server/features/codeActions.ts`:
  - `provideCodeActions(diagnostics, content, options)` retorna `CodeAction[]`.
  - Para cada diagnostic con `source = PowerScript:SD7` y mensaje
    que contiene `Sugerencia: <X>`, genera un text edit que sustituye
    la palabra por `X`.
- Tests sin LSP server (puramente sobre la firma de la función).

## Criterios
1. Genera CodeAction con `kind = 'quickfix'` y `edit.changes`.
2. No se rompe si no hay reemplazo en mensaje.
