# Plan - Spec 301 workspace migration assistant (B256)

## 1. Enfoque técnico

Reutilizar `WorkspaceState` como owning abstraction del slice. Primero se fijan probes unitarios para `pbl-only` y `mixed`, luego se implementa el asistente read-only y finalmente se expone por API pública/tool bridge/LSP/Markdown sin abrir un planner paralelo.

## 2. Pasos

1. Añadir un probe unitario que fije recomendaciones mínimas para layouts `pbl-only` y `mixed`.
2. Implementar `workspaceMigrationAssistant` reutilizando roots, build summaries, project model y aliases ORCA ya presentes en `WorkspaceState`.
3. Exponer la surface por API pública v2.8.0, tool bridge, LSP y comando Markdown.
4. Ajustar smoke/contrato para validar wiring y degradación honesta sin depender del timing exacto de discovery.
5. Alinear documentación viva y mover el foco canónico a `B257`.

## 3. Riesgos

- asumir disponibilidad inmediata cuando discovery aún no materializa roots ni source suficiente;
- sobrerrecomendar ORCA staging como layout canónico en vez de tratarlo como soporte temporal;
- duplicar contratos entre servidor y API pública en vez de reutilizar el esquema compartido.

## 4. Validación

- `npm run build:test`
- unit focal sobre `workspaceMigrationAssistant` y contrato público
- smoke de activación con API/comando read-only nuevos

## 5. Resultado ejecutado

1. El asistente B256 proyecta recomendaciones defendibles desde `WorkspaceState` sin tocar archivos.
2. La surface queda servida por API pública, tool bridge, LSP y comando Markdown.
3. El foco canónico del repo pasa a `B257`.