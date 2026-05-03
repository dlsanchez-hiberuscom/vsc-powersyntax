# Plan - Spec 296 semantic snapshot diff workspace states (B251)

## 1. Enfoque técnico

Reutilizar el snapshot semántico exportable ya cerrado en `B243`. El diff correcto es un cálculo read-only cliente-side sobre dos artefactos serializados, no una nueva capacidad del servidor.

## 2. Pasos

1. Extender la API pública y el bridge read-only con el contrato de diff.
2. Implementar el cálculo de cambios sobre snapshots exportados.
3. Cubrirlo con tests unitarios y una smoke de API pública.
4. Alinear documentación viva y mover el foco a `B252`.

## 3. Riesgos

- reintroducir una segunda fuente de verdad semántica fuera del snapshot exportado;
- producir diffs no defendibles por resumir de forma inconsistente objetos/símbolos/diagnósticos;
- dejar el contrato visible en la API pero no en el bridge read-only.

## 4. Validación

- `npm run build:test`
- unit focal sobre `semanticWorkspaceSnapshot` y `publicApi`
- smoke de extensión sobre export/import/diff de snapshots

## 5. Resultado ejecutado

1. La API pública v2.4.0 publica el diff versionado de snapshots.
2. El bridge read-only expone `semantic-snapshot-diff` con el mismo contrato.
3. El foco canónico pasa a `B252`.
