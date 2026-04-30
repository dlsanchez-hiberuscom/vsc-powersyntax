# Spec 040 — Comentarios anidados (B089)

## 1. Motivación

Soportar opcionalmente comentarios `/* ... */` anidados, útil en
fragmentos generados/embebidos que los usan como contenedor.

## 2. Alcance

- Extender `maskDocument(content, { nested?: boolean })`. Por defecto
  mantiene comportamiento actual (compatible). Con `nested: true` usa
  contador de profundidad.
- Tests `nestedComments`.

## 3. Criterios de aceptación

1. Modo por defecto sin cambios (regresión nula).
2. Modo nested cierra comentario solo cuando depth==0.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B089).
