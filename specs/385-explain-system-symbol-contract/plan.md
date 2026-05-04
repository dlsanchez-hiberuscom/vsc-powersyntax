# Plan — Spec 385 / B380

## Enfoque

1. Construir el report en servidor sobre `SystemCatalog` + `documentationService`.
2. Reutilizar indices existentes para evitar scans completos del catalogo.
3. Exponer despues el bridge read-only, el metodo publico y la UX Markdown minima.
4. Cerrar docs y backlog cuando el contrato quede validado end-to-end.

## Riesgos

- duplicar heuristica de lookup del hover;
- elegir un winner cuando la consulta siga siendo ambigua;
- filtrar mal por `ownerType` y degradar symbols de lenguaje globales.

## Mitigaciones

- partir de `findSystemSymbol` y de la localizacion ya publicada;
- devolver `ambiguous` con candidates compactos antes que inventar confidence alta;
- tratar `ownerType` como filtro adicional, no como requisito para keywords/enums/system-globals.