# Spec 020 — Library order resolver (B087)

## 1. Motivación

Cuando hay varias definiciones del mismo símbolo en distintas librerías,
PowerBuilder resuelve por el **library order** declarado en el target/proyecto.
Sin respetarlo, "Go to Definition" puede saltar a la copia equivocada.

## 2. Alcance

- Nuevo helper `resolveByLibraryOrder` en `src/server/knowledge/resolution/libraryOrder.ts`.
- Recibe un array de `Entity[]` candidatos y el `WorkspaceState`.
- Si todos los candidatos pertenecen al mismo proyecto, los reordena por
  el índice de su library en `topology.targets/projects[].libraries`.
- Si los candidatos pertenecen a varios proyectos, prefiere primero el del
  archivo activo (vía `ProjectRegistry.getProjectForFile(activeUri)`),
  luego aplica library order dentro.
- Integración en `provideDefinition` para reordenar resultados.

### Fuera de alcance

- Cambios en hover/completion (futuro).
- Resolución cross-target (P3).

## 3. Criterios de aceptación

1. Dos definiciones en libs A y B en mismo target → gana la primera del library order.
2. Definiciones en target del archivo activo > definiciones en otros.
3. Tests cubren ambos escenarios.

## 4. Documentación

- `docs/architecture.md`.
- `docs/current-focus.md`/`backlog.md` (B087 cerrada).
