# Spec 423 — CAT-01 Catalog follow-up plan

## Estado

- done

## Relación backlog

- Backlog item: `CAT-01 — Plan de catálogo, ownership y source-of-truth siguiente`

## Objetivo

Ordenar la siguiente ola P1 del catálogo sin reabrir ADR-0001 ni ensanchar el hot path interactivo.

## Resultado esperado

- siguiente slice de catálogo/ownership/domains priorizado;
- guardrails explícitos sobre `generated-primary-with-manual-overlays`;
- contrato de validación y reporting para el slice elegido.

## Validación mínima esperada

- `npm run test:docs:drift`

## Fuera de alcance

- reabrir la decisión de source-of-truth ya cerrada;
- abrir cambios de catálogo sin una matriz de validación explícita.

## Cierre registrado

- el siguiente slice P1 queda acotado a **ownership e identidad de dominios excepción**, reforzando el contrato de `generated-primary-with-manual-overlays` y manteniendo como único frente abierto los dominios `manual-primary` permitidos y las colisiones de identidad que puedan degradar consistency/adoption;
- los no-go explícitos quedan fijados: no reabrir ADR-0001, no mezclar catálogo con localización y no ensanchar el hot path de query/serving mientras el baseline runtime siga cubierto por `catalogV2`, `catalogConsistency`, `catalogAdoptionDecision` y `systemCatalogQueryHardening`;
- la validación focal futura queda definida sobre consistency, adoption, provenance e identidad antes de tocar generator o runtime.

## Validación ejecutada

- `npm run test:docs:drift`
