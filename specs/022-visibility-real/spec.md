# Spec 022 — Visibility real (B059)

## 1. Motivación

Para reducir falsos positivos en completion/definition y preparar
diagnósticos semánticos, la KB debe reconocer y filtrar por la visibilidad
real del símbolo.

## 2. Alcance

- Tipo `Visibility` en `src/server/knowledge/types.ts`:
  `'public' | 'protected' | 'private' | 'system'`.
- Helper `src/server/knowledge/visibility.ts`:
  - `parseVisibility(token: string | undefined): Visibility`
  - `isAccessibleFrom(symbol, contextOwner, contextProject, registry, inherits)`
  - Soporte mínimo para `protectedread`/`privateread`/`writeonly` mapeados
    a `protected`/`private` para esta fase.
- Wiring en completion/definition para descartar miembros `private` o
  `protected` cuando el contexto no cumple.

### Fuera de alcance

- Diagnóstico de violación de visibilidad (P2).

## 3. Criterios de aceptación

1. `parseVisibility` interpreta correctamente los tokens canónicos y
   variantes `*read`/`*write`.
2. `isAccessibleFrom`:
   - public → siempre true.
   - private → solo mismo owner (containerName).
   - protected → owner o sus descendientes (vía graph).
3. Tests cubren los tres niveles.

## 4. Documentación

- `docs/architecture.md`, `docs/backlog.md` (B059).
