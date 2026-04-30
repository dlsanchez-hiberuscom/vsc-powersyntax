# Spec 019 — Project registry con scoring (B057)

## 1. Motivación

Una vez parseada la topología (spec 018), hace falta asociar cada archivo
fuente a su **proyecto preferido** para resolver símbolos sin mezclar
contenido de targets/proyectos distintos.

## 2. Alcance

- Nuevo módulo `src/server/workspace/projectRegistry.ts`.
- API:
  - `buildProjectRegistry(topology, sourceFiles): ProjectRegistry`
  - `ProjectRegistry.getProjectForFile(uri): string | null`
  - `ProjectRegistry.getAllProjects(): string[]`
  - `ProjectRegistry.getFilesForProject(projectUri): string[]`
- Scoring:
  1. Pertenencia explícita por library (`.pbl` referenciada por target/project).
  2. Cercanía por path (carpeta más profunda del marker preferido).
  3. Empate → primer marker registrado.

### Fuera de alcance

- Reasignación dinámica al cambiar topología (futuro, requiere watch).
- Library order (B087, spec 020).

## 3. Criterios de aceptación

1. Para un workspace con 2 targets, cada archivo se asocia al target con
   library coincidente más cercana.
2. Si un archivo no encaja por library, se asocia por proximidad path.
3. Tests cubren: match exacto por library, fallback por path, sin match.

## 4. Documentación

- `docs/architecture.md`.
- `docs/current-focus.md`/`backlog.md` (B057 cerrada).
