# Plan — Spec 384 / B379

## Enfoque

1. Reutilizar la heuristica ya existente del Diagnostics Explainability Panel.
2. Publicarla como builder reutilizable para report/tool/API.
3. Cablear `explain-diagnostic` en `publicApi`, bridge read-only, comandos y smoke/unit tests.
4. Cerrar docs/backlog/current-focus/done-log despues de validar.

## Riesgos

- duplicar logica explicativa entre panel y tool;
- resolver mal el diagnostic objetivo cuando hay varios en la misma posicion;
- disparar efectos UI no deseados desde la API publica.

## Mitigaciones

- extraer el rail explicativo a un modulo comun del cliente;
- dejar seleccion determinista con `diagnosticIndex` y posicion;
- separar comando API (`powerbuilder.explainDiagnostic`) de wrapper UX (`vscPowerSyntax.openExplainDiagnostic`).