# Spec 028 — Code masking pipeline (B092 / B138)

## 1. Motivación

Centralizar el stripping de strings y comentarios para que diagnostics,
references, completion y futuros consumidores compartan una sola
implementación.

## 2. Alcance

- Nuevo módulo `src/server/parsing/codeMasking.ts`:
  - `maskString(line: string): string` — equivalente a `stripCommentsAndStrings` pero ubicación canónica.
  - `maskDocument(content: string): string` — mantiene posiciones; sustituye contenido de strings/comentarios por espacios. Soporta:
    - `// ...` hasta fin de línea.
    - `/* ... */` multilinea.
    - `"..."` y `'...'` con escapes simples.
- Re-export desde `diagnostics.ts` para no romper imports actuales.

### Fuera de alcance

- Detección de SQL embebido (B090, otra spec).

## 3. Criterios de aceptación

1. Longitud preservada en `maskDocument`.
2. Comentarios `//` y `/* */` enmascarados.
3. Strings dobles y simples enmascarados.
4. Tests cubren los tres casos + multilínea.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B092 cerrada).
