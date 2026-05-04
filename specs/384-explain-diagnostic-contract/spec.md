# Spec 384 — B379 Explain diagnostic tool and suggested safe fix contract

## Estado

- done

## Relacion backlog

- Backlog item: `B379 — Explain diagnostic tool and suggested safe fix contract`

## Objetivo

Exponer un tool/API/comando read-only que explique un diagnostic concreto con evidencia minima, reason code y safe fix sugerido cuando exista, sin abrir un motor nuevo de diagnostics ni modificar archivos.

## Alcance

- añadir `explain-diagnostic` al contrato publico read-only;
- reutilizar diagnostics ya publicados, `currentObjectContext` y `safeEditPlan`;
- publicar un report compacto y un markdown explicable para el editor.

## Fuera de alcance

- aplicar fixes automaticamente;
- reimplementar diagnostics en servidor;
- abrir writes o un segundo pipeline semantico.