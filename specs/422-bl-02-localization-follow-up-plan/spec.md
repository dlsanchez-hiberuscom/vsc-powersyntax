# Spec 422 — LOC-01 Localization follow-up plan

## Estado

- done

## Relación backlog

- Backlog item: `LOC-01 — Plan de localización documental del catálogo y consumers`

## Objetivo

Ordenar el siguiente slice P1 de localización documental y authoring sin duplicar identidad semántica ni abrir overlays paralelos.

## Resultado esperado

- siguiente slice priorizado entre authoring, audit o serving;
- límites de overlay, fallback e identidad definidos;
- validación focal para serving locale-aware y authoring.

## Validación mínima esperada

- `npm run test:docs:drift`

## Fuera de alcance

- traducir masivamente el catálogo en este corte;
- abrir un rail de localización paralelo al existente.

## Cierre registrado

- el siguiente slice P1 queda priorizado en **authoring incremental guiado por audit**, no en serving nuevo: escoger dominios por `report:catalog-localization`, reforzar overlays españoles del rail actual y reconciliar `targetId`/`targetKey` cuando el audit publique drift recuperable;
- los límites explícitos quedan fijados: no traducir anchors técnicos ni identidad semántica, no duplicar entries por idioma y no abrir cambios de runtime salvo que aparezca un gap no cubierto por `documentationService`, `documentationLocale` o `catalogLocalization`;
- la validación focal futura queda definida sobre audit/localization/locale consumers antes de tocar el rail visible.

## Validación ejecutada

- `npm run test:docs:drift`
