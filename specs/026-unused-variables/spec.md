# Spec 026 — Variables no usadas — fortalecimiento (B034)

## 1. Motivación

SD4/SD5 ya existen pero su detección es puramente textual y produce falsos
positivos cuando el nombre aparece dentro de comentarios o cadenas. B034
exige un análisis con menos ruido apoyado en scopes reales.

## 2. Alcance

- Helper `stripCommentsAndStrings(line: string): string` en
  `src/server/features/diagnostics.ts` (o utilitario aparte).
  - Elimina `// ...` hasta fin de línea.
  - Sustituye `"..."`/`'...'` por espacios del mismo largo.
  - Soporta comentarios bloque `/* */` línea a línea (best effort).
- Aplicado tanto en `checkUnusedLocals` como en
  `checkUnusedPrivateInstanceVars` antes del regex word-boundary.
- Tests dedicados: nombre dentro de comentario o string no debe contar como uso.

### Fuera de alcance

- Reescribir SD4/SD5 con AST.
- Detectar uso solo en LHS de asignación.

## 3. Criterios de aceptación

1. Variable cuyo único "uso" está en `// foo` se reporta como no usada.
2. Variable cuyo único "uso" está dentro de una cadena `"foo"` se reporta como no usada.
3. Tests cubren ambos casos sin romper los existentes.

## 4. Documentación

- `docs/backlog.md` (B034 cerrada), `docs/architecture.md`.
