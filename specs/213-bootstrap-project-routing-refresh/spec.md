# Spec 213 - Bootstrap project routing refresh (B141A)

## 1. Resumen

Reutilizar `refreshProjectRouting()` en el bootstrap del servidor para evitar que el runtime siga montando manualmente `ProjectRegistry` y `UnifiedProjectModel` por separado.

## 2. Problema

Tras la Spec 212 ya existía un punto único para recomponer routing project-aware, pero el bootstrap del servidor seguía creando y conectando ambos artefactos manualmente.

## 3. Objetivo

Usar el mismo entrypoint centralizado tanto en bootstrap como en cambios externos del watcher.

## 4. Alcance

- sustituir wiring manual del bootstrap por `refreshProjectRouting()`;
- fijar el contrato de recomposición con test unitario de `WorkspaceState`.

## 5. Fuera de alcance

- retirar aún las APIs legacy de set/getProjectRegistry;
- cerrar toda la épica `B141A`.

## 6. Requisitos

- R1. Bootstrap y watcher deben poder recomponer routing con el mismo punto central.
- R2. `WorkspaceState.refreshProjectRouting()` debe poblar registry y model coherentemente.

## 7. Criterios de aceptacion

- AC1. `server.ts` ya no crea manualmente registry/model por separado en bootstrap.
- AC2. Existe test unitario directo de `refreshProjectRouting()`.
- AC3. La compilación y la suite de workspace quedan verdes.

## 8. Riesgos y notas

- La centralización reduce duplicidad, pero aún no retira las superficies legacy del estado.