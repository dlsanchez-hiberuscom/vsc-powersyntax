# Spec 058 — Fair scheduler por proyecto (B129)

## Motivación
En workspaces con múltiples raíces, evitar que un proyecto monopolice
recursos. Round-robin por project key.

## Alcance
- `src/server/runtime/fairScheduler.ts`:
  - `createFairScheduler<T>()` con `enqueue(project, item)`, `dequeue(): {project, item} | undefined`, `size`.

## Criterios
1. Round-robin equitativo entre dos proyectos.
2. Vacío → undefined.
