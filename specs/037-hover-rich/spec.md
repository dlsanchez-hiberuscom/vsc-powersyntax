# Spec 037 — Hover enriquecido (B103)

## 1. Motivación

Mostrar más información útil en hover de entidades del usuario:
acceso, librería externa, prototipo vs implementación, owner.

## 2. Alcance

- `buildUserEntityMarkdown` muestra:
  - Acceso (`public`/`protected`/`private`).
  - `External library "<lib>"` cuando `isExternal`.
  - Etiqueta `(Prototype)` o `(Implementation)` según `implementationKind`.
  - Owner chain (`containerName`).
- Test puro sobre `formatUserHover` (función exportada).

## 3. Criterios de aceptación

1. Acceso visible cuando existe.
2. Library visible para externas.
3. Prototype/Implementation visible.
4. Tests cubren los tres.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B103).
