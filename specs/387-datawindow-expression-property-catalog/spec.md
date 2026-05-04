# Spec 387 — B320 DataWindow expression/property official catalog

## Estado

- done

## Relacion backlog

- Backlog item: `B320 — DataWindow expression/property official catalog`

## Objetivo

Integrar funciones de expresiones DataWindow y propiedades oficiales de objetos DW en el catálogo v2, manteniéndolas separadas de PowerScript general y reutilizables sólo en contexto DataWindow defendible.

## Alcance

- poblar dominios `datawindow-properties` y `datawindow-expression-functions` dentro de `catalog v2`;
- indexar lookups por dominio/namespace sin scans globales;
- migrar progresivamente los consumers DataWindow existentes desde literals hardcodeados hacia ese catálogo.

## Fuera de alcance

- parsear DataWindow como PowerScript normal;
- abrir surfaces fuera de contexto DataWindow defendible;
- cerrar B327 en la misma slice.