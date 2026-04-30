# Spec 048 — Rename pre-flight (B032)

## Motivación
Validar de forma temprana si un símbolo es renombrable antes de ejecutar
el rename real. Bloquea identificadores de sistema, palabras reservadas,
y nombres no compatibles con PowerScript.

## Alcance
- `src/server/features/renamePreflight.ts`:
  - `validateRenameTarget(name, ctx): { ok: boolean; reason?: string }`.
  - Rechaza:
    - palabras reservadas conocidas (lista mínima),
    - nombres en SystemCatalog,
    - identificadores no válidos (`^[A-Za-z_][\w$#%-]*$`).
- Tests.

## Criterios
1. Acepta `of_doSomething`.
2. Rechaza `MessageBox` (sistema).
3. Rechaza `if`, `123abc`.
