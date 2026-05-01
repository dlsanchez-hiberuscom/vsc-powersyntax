# Spec 218 - Project routing invariants closure (B141A/B141)

## 1. Resumen

Cerrar el residual final de adopcion runtime de `UnifiedProjectModel` asegurando que el reset completo del workspace no conserve routing legacy y dejando alineados los artefactos canónicos.

## 2. Problema

El runtime ya reutilizaba `UnifiedProjectModel` en cache, indexador, watcher, `libraryOrder` y status activo, pero `WorkspaceState.clear()` seguia conservando `projectRegistry`. Eso dejaba un invariant roto tras un reset completo y mantenia `B141A` abierto en la documentacion aunque el hot path ya no dependia de fallbacks legacy.

## 3. Objetivo

Cerrar `B141A` y, con ello, el cierre formal de `B141` como modelo unico de proyecto/routing en runtime.

## 4. Alcance

- limpiar `projectRegistry` junto a `projectModel` al resetear `WorkspaceState`;
- cubrir el invariant con test unitario de routing;
- mover `B141/B141A` fuera del backlog activo;
- alinear `current-focus`, `roadmap` y `done-log` con el estado real.

## 5. Fuera de alcance

- nuevas surfaces de serving;
- reordenacion adicional del scheduler;
- cambios funcionales en discovery, topologia o cache persistente.

## 6. Requisitos

- R1. Un reset completo del workspace no debe conservar routing legacy reutilizable.
- R2. El contrato de proyecto activo debe seguir derivandose del `UnifiedProjectModel`.
- R3. `B141A` no puede seguir marcado como `Partial` si el runtime ya usa un unico modelo project-aware.

## 7. Criterios de aceptacion

- AC1. `WorkspaceState.clear()` deja `projectRegistry`, `projectModel` y `getProjectContextForFile()` en estado nulo/seguro.
- AC2. Existe test unitario explicito para ese invariant.
- AC3. `backlog`, `current-focus`, `roadmap` y `done-log` reflejan el cierre de `B141A/B141`.

## 8. Riesgos y notas

- Esta spec no sustituye las slices historicas `149-152` y `209/211-215`; las cierra formalmente reforzando su invariant final.
- El siguiente foco operativo vuelve a `B122`, `B125`, `B134`, `B158` y `B159`.